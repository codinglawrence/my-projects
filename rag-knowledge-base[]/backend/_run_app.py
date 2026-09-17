"""Local launcher for the RAG backend.

Uses uvicorn.run() API instead of `python -m uvicorn`, which segfaults in this
particular Windows sandbox process model. On a real machine / Docker the
standard `uvicorn app.main:app` works fine.

NOTE: this sandbox's `torch` native extension crashes on import (access
violation). The app never uses torch/transformers (embeddings go through
dashscope, the LLM is DeepSeek over HTTP), but `langchain_openai` transitively
lazy-imports `transformers` -> `torch`. We stub `transformers` as an empty
package so that lazy import degrades gracefully and never reaches `import torch`.
This is a sandbox-only shim; on a normal machine torch loads fine and the stub
is simply never needed.
"""
import sys
import types

_pkg = types.ModuleType("transformers")
_pkg.__path__ = []  # empty package -> submodule imports raise ImportError,
_pkg.__version__ = "stub"  # which langchain's lazy loader handles gracefully
sys.modules["transformers"] = _pkg

import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False, http="h11")
