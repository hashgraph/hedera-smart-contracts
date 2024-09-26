# Hedera Smart Contracts

Gas analysis was conducted in order to understand the percentage deviation between N pairs using G1 for public key and G1 for signature and message.

## Results:

| Pairs | G1 public key | G1 signature and message | Gas        | Percentage deviation |
|-------|---------------|--------------------------|------------|----------------------|
| 1     | ✅            | ❌                        | 149 004    | +0.82                |
| 1     | ❌            | ✅                        | 147 751    | -0.82                |
| 2     | ✅            | ❌                        | 200 004    | +0.61                |
| 2     | ❌            | ✅                        | 198 801    | -0.61                |
| 10    | ✅            | ❌                        | 533 915    | +0.22                |
| 10    | ❌            | ✅                        | 532 701    | -0.22                |
| 20    | ✅            | ❌                        | 960 846    | +0.12                |
| 20    | ❌            | ✅                        | 959 729    | -0.12                |
| 50    | ✅            | ❌                        | 2 308 522  | +0.05                |
| 50    | ❌            | ✅                        | 2 307 380  | -0.05                |
| 75    | ✅            | ❌                        | 3 294 430  | +0.03                |
| 75    | ❌            | ✅                        | 3 293 262  | -0.03                |
