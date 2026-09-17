"""Boot guardian for the RAG backend.

Problem: importing `torch` (pulled in transitively via langchain_openai ->
langchain_core -> transformers) intermittently segfaults at process start in
this Windows sandbox (native extension load race). It's flaky, not deterministic.

Fix: a tiny parent process (only stdlib, no torch) keeps spawning `_run_app.py`
children. As soon as a child reports healthy on /health, the parent keeps it
alive. If a child dies (segfault), the parent retries with a fresh process.
"""
import subprocess
import sys
import os
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
URL = "http://127.0.0.1:8000/health"


def health_ok():
    try:
        urllib.request.urlopen(URL, timeout=3)
        return True
    except Exception:
        return False


def main():
    for attempt in range(1, 40):
        print(f"[boot] attempt {attempt}", flush=True)
        proc = subprocess.Popen(
            [sys.executable, "_run_app.py"],
            cwd=HERE,
            env={**os.environ, "PYTHONFAULTHANDLER": "1"},
        )
        up = False
        for _ in range(45):  # up to ~45s for this child to come up
            if proc.poll() is not None:
                break  # child died
            if health_ok():
                up = True
                break
            time.sleep(1)
        if up:
            print("[boot] server healthy — monitoring child...", flush=True)
            proc.wait()  # block; if it dies later we retry
            print("[boot] child exited, restarting...", flush=True)
        else:
            print("[boot] attempt failed, retrying", flush=True)
            try:
                proc.kill()
            except Exception:
                pass
            time.sleep(2)


if __name__ == "__main__":
    main()
