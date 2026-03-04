/**
 * CharlKnowledge — bakes the Charl ML language into awaitter's knowledge base.
 *
 * Charl is a statically-typed programming language for AI/ML research.
 * Because it is too new to be in any model's training data, this module
 * reads the cloned repo and compiles a comprehensive reference that is
 * injected into EVERY agent's system prompt whenever a .ch/.charl project
 * is detected — making awaitter a native Charl expert.
 *
 * Repo expected at: ~/Projects/charlcode
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ── Repo location ────────────────────────────────────────────────────────────

const CHARL_REPO_CANDIDATES = [
  path.join(os.homedir(), 'Projects', 'charlcode'),
  path.join(os.homedir(), 'charlcode'),
  '/opt/charlcode',
];

function findCharlRepo(): string | null {
  return CHARL_REPO_CANDIDATES.find(p =>
    fs.existsSync(path.join(p, 'docs', 'SPECIFICATION.md'))
  ) ?? null;
}

// ── Binary detection ─────────────────────────────────────────────────────────

export function getCharlBinPath(): string | null {
  const candidates = [
    path.join(os.homedir(), '.charl', 'bin', 'charl'),
    '/usr/local/bin/charl',
    '/usr/bin/charl',
  ];
  const repo = findCharlRepo();
  if (repo) {
    candidates.unshift(path.join(repo, 'charl'));
  }
  return candidates.find(p => fs.existsSync(p)) ?? null;
}

// ── Project detection ────────────────────────────────────────────────────────

/**
 * Returns true if the working directory contains Charl source files.
 * Used to decide whether to inject the knowledge pack.
 */
export function isCharlProject(workingDir: string): boolean {
  try {
    const files = fs.readdirSync(workingDir);
    return files.some(f => f.endsWith('.ch') || f.endsWith('.charl'));
  } catch {
    return false;
  }
}

// ── Knowledge pack ───────────────────────────────────────────────────────────

/**
 * Builds the Charl knowledge pack from the cloned repo.
 * Always returns a useful pack — either from the live repo or the embedded fallback.
 *
 * @param compact  true = shorter version for 8K-context models (qwen 14b/32b)
 *                 false = full version for large-context models
 */
export function getCharlKnowledgePack(compact: boolean = true): string {
  const repo = findCharlRepo();
  const binPath = getCharlBinPath();
  const runCmd = binPath ? `${binPath} run <file.ch>` : 'charl run <file.ch>';

  // Try to read live spec from repo
  let specContent = '';
  if (repo) {
    const specPath = path.join(repo, 'docs', 'SPECIFICATION.md');
    if (fs.existsSync(specPath)) {
      specContent = fs.readFileSync(specPath, 'utf-8');
    }
  }

  // Try to read examples from repo
  const examples: Record<string, string> = {};
  if (repo) {
    const exampleFiles = [
      'examples/neural_network.ch',
      'examples/training_backprop.ch',
      'examples/training_simple.ch',
      'examples/autograd.ch',
      'examples/mnist.ch',
    ];
    for (const f of exampleFiles) {
      const p = path.join(repo, f);
      if (fs.existsSync(p)) {
        examples[path.basename(f)] = fs.readFileSync(p, 'utf-8');
      }
    }
  }

  return buildKnowledgePack(runCmd, specContent, examples, compact);
}

// ── Pack builder ─────────────────────────────────────────────────────────────

function buildKnowledgePack(
  runCmd: string,
  specContent: string,
  examples: Record<string, string>,
  compact: boolean
): string {
  const sections: string[] = [];

  sections.push(`# CHARL LANGUAGE — COMPLETE REFERENCE
Charl is a statically-typed programming language built specifically for AI/ML.
Files use .ch extension (primary). Also accepts .charl.
To run a Charl program: ${runCmd}
Performance: ~22x faster than PyTorch CPU (AOT compilation via Rust backend).
⚠️ THERE IS NO "import charl". NO charl.Sequential, NO charl.Dense, NO charl.Optimizer.
Charl has BUILT-IN functions — use them directly: nn_linear(), nn_relu(), optim_sgd_step(), etc.`);

  // ── Types ────────────────────────────────────────────────────────────────
  sections.push(`## TYPES
\`\`\`charl
// Primitives
int32  int64  float32  float64  bool  string

// Tensor (first-class type with compile-time shape)
tensor<float32, [5]>          // 1D vector of 5 elements
tensor<float32, [3, 4]>       // 2D matrix 3x4
tensor<float32, [16, 3, 224, 224]>  // 4D batch of images
\`\`\``);

  // ── Syntax ───────────────────────────────────────────────────────────────
  sections.push(`## SYNTAX
\`\`\`charl
// Variables
let x: int32 = 10
let y = 3.14          // type inferred as float64
let arr = [1, 2, 3]   // inferred as tensor<int32, [3]>

// Functions
fn add(x: int32, y: int32) -> int32 {
    return x + y
}

// Control flow
if x > 0 { } else { }
for i in 0..10 { }
while i < 10 { i = i + 1 }

// Operators
+  -  *  /  %       // arithmetic
@                    // matrix multiplication (tensors)
==  !=  <  <=  >  >= // comparison
and  or  not          // logical
\`\`\``);

  // ── Tensor builtins ───────────────────────────────────────────────────────
  sections.push(`## TENSOR BUILTINS
\`\`\`charl
// Creation
tensor([1.0, 2.0, 3.0])             // from array
tensor_zeros([4])                    // zero tensor shape [4]
tensor_ones([3, 3])                  // ones tensor
random_normal([10])                  // random normal
random_uniform([5, 5])               // random uniform

// Shape
tensor_reshape(t, [2, 4])            // reshape
tensor_transpose(t)                  // transpose
tensor_flatten(t)                    // flatten to 1D

// Math
tensor_sum(t)                        // sum all → scalar
tensor_mean(t)                       // mean → scalar
tensor_mul(t, scalar)                // multiply by scalar
tensor_add(t1, t2)                   // element-wise add
tensor_sub(t1, t2)                   // element-wise subtract
tensor_print(t)                      // print tensor values
sum(t)                               // alias for tensor_sum
mean(t)                              // alias for tensor_mean

// Matrix multiplication
let result = m1 @ m2                 // shape [a,b] @ [b,c] → [a,c]
\`\`\``);

  // ── Neural network builtins ────────────────────────────────────────────
  sections.push(`## NEURAL NETWORK BUILTINS (nn_*)
\`\`\`charl
// Core layer operations
nn_linear(input, weight, bias)       // fully connected: input @ weight + bias
nn_relu(tensor)                      // ReLU activation: max(0, x)
nn_sigmoid(tensor)                   // sigmoid: 1/(1+e^-x)
nn_tanh(tensor)                      // tanh activation
nn_softmax(tensor)                   // softmax (for classification output)
nn_gelu(tensor)                      // GELU activation

// Loss functions
loss_mse(predictions, targets)       // mean squared error
loss_cross_entropy(probs, labels)    // cross entropy
loss_binary_cross_entropy(p, t)      // binary cross entropy

// Autograd-specific gradient functions
autograd_compute_mse_grad(pred, target)           // MSE gradient
autograd_compute_sigmoid_grad(output, grad_out)   // sigmoid backward
autograd_compute_relu_grad(pre_activation, grad)  // ReLU backward
autograd_compute_linear_grad(input, w, b, grad)   // linear backward
                                                   // returns tuple: (grad_input, grad_w, grad_b)
\`\`\``);

  // ── Optimizers ────────────────────────────────────────────────────────
  sections.push(`## OPTIMIZERS
\`\`\`charl
// SGD: parameter = parameter - lr * gradient
let updated = optim_sgd_step(param, grad, learning_rate)

// Adam: adaptive learning rate
let result = optim_adam_step(param, grad, m, v, t, lr, beta1, beta2)
let updated_param = result.0
let updated_m     = result.1
let updated_v     = result.2
\`\`\``);

  // ── Autograd ─────────────────────────────────────────────────────────
  sections.push(`## AUTOGRAD (automatic differentiation)
\`\`\`charl
// High-level: autograd computes gradient of a function w.r.t its input
fn loss_fn(x: tensor<float32, [10]>) -> float32 {
    return sum(x * x)    // L2 loss
}
let x = tensor([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0])
let grad = autograd(loss_fn, x)  // gradient has same shape as x

// Low-level (manual backprop in training loops)
let grad_pred = autograd_compute_mse_grad(pred, y_train)
let grad_z2   = autograd_compute_sigmoid_grad(pred, grad_pred)
let grads_l2  = autograd_compute_linear_grad(h1, w2, b2, grad_z2)
let grad_h1   = grads_l2.0  // tuple access with .0 .1 .2
let grad_w2   = grads_l2.1
let grad_b2   = grads_l2.2
\`\`\``);

  // ── Model DSL ────────────────────────────────────────────────────────
  sections.push(`## MODEL DSL (declarative neural networks)
\`\`\`charl
model MnistClassifier {
    layers {
        dense(784, 128, activation: relu)
        dropout(0.2)
        dense(128, 64, activation: relu)
        dropout(0.2)
        dense(64, 10, activation: softmax)
    }
}

// Usage
let model = MnistClassifier()
let output = model.forward(input)
let loss   = cross_entropy(output, target)
let grads  = autograd(loss, model.parameters())
model.update_parameters(grads, learning_rate)

// Convolutional layers
conv2d(in_channels, out_channels, kernel_size, stride, padding)
\`\`\``);

  // ── Standard library ──────────────────────────────────────────────
  sections.push(`## STDLIB
\`\`\`charl
print("text", variable)            // print values
str(value)                         // convert to string
relu(x)     sigmoid(x)  tanh(x)   // standalone activation functions
exp(t)      log(t)      sqrt(t)   // math on tensors
pow(t, n)
argmax(tensor, axis: 1)           // argmax along axis
\`\`\``);

  // ── Working example ────────────────────────────────────────────────
  const backpropExample = examples['training_backprop.ch'];
  if (backpropExample && !compact) {
    sections.push(`## COMPLETE WORKING EXAMPLE — XOR with Backprop
\`\`\`charl
${backpropExample.slice(0, 1500)}
\`\`\``);
  } else if (backpropExample) {
    // Compact: key patterns only
    sections.push(`## KEY PATTERNS
\`\`\`charl
// Initialize layer weights
let w1_data = tensor([0.5, -0.3, 0.2, 0.4, -0.1, 0.6, 0.3, -0.4])
let w1 = tensor_reshape(w1_data, [2, 4])
let b1 = tensor_zeros([4])

// Forward pass
let z1   = nn_linear(x, w1, b1)
let h1   = nn_relu(z1)
let pred = nn_sigmoid(nn_linear(h1, w2, b2))
let loss = loss_mse(pred, y_target)

// Backward pass
let grad_pred = autograd_compute_mse_grad(pred, y_target)
let grad_z2   = autograd_compute_sigmoid_grad(pred, grad_pred)
let grads_l2  = autograd_compute_linear_grad(h1, w2, b2, grad_z2)
let grad_w2   = grads_l2.1
let grad_b2   = grads_l2.2

// SGD update
w2 = optim_sgd_step(w2, grad_w2, 0.01)
b2 = optim_sgd_step(b2, grad_b2, 0.01)

// Adam update
let adam_res = optim_adam_step(param, [grad], m, v, t, lr, 0.9, 0.999)
param = adam_res.0
m     = adam_res.1
v     = adam_res.2
\`\`\``);
  }

  // ── MNIST model DSL example ────────────────────────────────────────
  const mnistExample = examples['mnist.ch'];
  if (mnistExample && !compact) {
    sections.push(`## COMPLETE WORKING EXAMPLE — MNIST Classifier
\`\`\`charl
${mnistExample.slice(0, 2000)}
\`\`\``);
  }

  // ── Agent rules ───────────────────────────────────────────────────
  sections.push(`## COMMON MISTAKES — WRONG vs RIGHT
\`\`\`
❌ import charl                     ✅ (nothing — builtins are global)
❌ charl.Dense(2, 4)                ✅ nn_linear(x, w, b)
❌ charl.Sequential([...])          ✅ model MyNet { layers { dense(...) } }
❌ matmul(a, b)                     ✅ a @ b  OR  nn_linear(x, w, b)
❌ np.dot(a, b)                     ✅ a @ b
❌ a.T                              ✅ tensor_transpose(a)
❌ x.reshape([2, 4])                ✅ tensor_reshape(x, [2, 4])
❌ np.zeros([4])                    ✅ tensor_zeros([4])
❌ np.random.randn(4)               ✅ random_normal([4])
❌ x.astype(float)                  ✅ (not needed — static typing)
❌ sum(x, axis=0)                   ✅ tensor_sum(x)
❌ for i in range(50)               ✅ for i in 0..50
❌ w -= learning_rate * grad        ✅ w = optim_sgd_step(w, grad, learning_rate)
❌ w = w - lr * g  (manual update)  ✅ w = optim_sgd_step(w, g, lr)
❌ xor_network.chl                  ✅ xor_network.ch
❌ xor_network.charl                ✅ xor_network.ch
❌ loss_cross_entropy(...)          ✅ loss_cross_entropy(probs, labels)  (it's loss_cross_entropy not cross_entropy)
\`\`\`

## CHARL AGENT RULES
- Files MUST use .ch extension (e.g. xor.ch, mnist.ch, transformer.ch). NOT .chl, NOT .charl
- Run with: ${runCmd}
- NO import statements — all builtins are global, no module system
- NO charl.X, NO charl.Sequential, NO charl.Dense — these do NOT exist
- NO numpy, NO torch, NO external libraries — Charl has everything built in
- tensor_reshape to change shapes, tensor_zeros for zero init, random_normal for init
- Tuple access: .0 .1 .2 (not [0], not array destructuring)
- String concat: "text " + str(variable)
- Loops: for i in 0..N  (NOT range(N))
- Weight update: ALWAYS use optim_sgd_step or optim_adam_step, never manual -= `);

  return sections.join('\n\n');
}
