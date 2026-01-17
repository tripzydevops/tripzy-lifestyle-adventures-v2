
import sys
import os

print(f"Propagating sys.path: {sys.path}")
print(f"CWD: {os.getcwd()}")

try:
    import backend
    print("Successfully imported backend")
    import backend.main
    print("Successfully imported backend.main")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Error: {e}")
