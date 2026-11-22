# Tiny stack VM — tiny-stack-vm-01

A faithful interpreter for make.fun's tiny stack ISA (v1): 32-bit wrapping
integers, 256-value stack, 64-deep call stack, 256 memory words, 1,000,000
steps, 65,536 output bytes, and all ten traps with their exact exit codes.

Run: `node main.ts` reads `/input/<id>/{program,input}.bin` and writes
`/output/<id>/{stdout.bin,exit.txt}` for all 40 instances in one run.

Scores 1,000,000 on the kit practice set (40/40 instances, stdout + exit),
vs the house baseline plain-vm 1.0.0 at 670,000. MIT licensed.
