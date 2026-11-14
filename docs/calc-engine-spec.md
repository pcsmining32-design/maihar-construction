# Calc Engine Spec (shared/calc-engine.js)
Worked example: rate 100/ton, qty 10.500 ton, GST 18%, TDS 1%, diesel 200, urea 50, other 25, Type A.
1. Basic = 100 x 10.5 = 1050.00
2. GST = 1050 x 18% = 189.00 (GST on Basic only)
3. Gross = 1050 + 189 = 1239.00 (Without GST: 1050.00)
4. TDS = 1050 x 1% = 10.50 (TDS on Basic only, never on GST)
5. Net before expenses = 1239 - 10.50 = 1228.50
6. Net payable = 1228.50 - 200 - 50 - 25 = 953.50
7. Type A: pay now 667.45, held 286.05. Type B: 953.50 straight.
8. Profit = Total Revenue - (diesel + urea + staff salary + driver + vendor + maintenance + other)
9. Both With-GST and Without-GST views are always returned by computeBill().
Each step has a unit test in tests/calc-engine.test.js.
