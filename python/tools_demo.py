"""03 — Tool / Function Calling (Python parity).

The mock model decides whether to call a tool, runs it, and folds the result
into the final answer. Run from the /python directory:  python tools_demo.py
"""
from _shared.data import load_corpus
from _shared.mock_llm import decide_tool_call, mock_llm
from _shared.tools import run_tool

if __name__ == "__main__":
    corpus = load_corpus("knowledge-base")

    for prompt in ("What is 23 * 19?", "Look up vector database", "Tell me a story"):
        print(f'PROMPT: {prompt}')
        call = decide_tool_call(prompt)
        if call:
            result = run_tool(call["tool"], call["args"], corpus)
            print(f'  tool: {call["tool"]} -> {result["output"]}')
            answer = mock_llm(prompt, context=[f'Tool {result["tool"]} returned: {result["output"]}'])
        else:
            print("  no tool needed")
            answer = mock_llm(prompt)
        print(f"  answer: {answer}\n")
