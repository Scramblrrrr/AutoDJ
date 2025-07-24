#!/usr/bin/env python3
"""
Simple test script to verify Python output is being captured by Node.js
"""
import sys
import time

print("TEST: Simple Python script started", flush=True)
print("TEST: This should appear immediately", flush=True)

for i in range(5):
    print(f"TEST: Count {i+1}/5", flush=True)
    time.sleep(1)

print("TEST: Script completed successfully", flush=True)
sys.exit(0) 