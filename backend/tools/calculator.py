"""Safe Calculator Tool using Python AST evaluation."""

import ast
import operator
from typing import Dict, Any
from backend.tools.base import BaseTool

# Supported safe operators
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def safe_eval(node):
    """Recursively evaluate mathematical AST node safely."""
    if isinstance(node, ast.Constant):  # <number>
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant: {node.value}")
    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPERATORS:
            raise ValueError(f"Unsupported operator: {op_type}")
        left = safe_eval(node.left)
        right = safe_eval(node.right)
        if op_type in (ast.Div, ast.FloorDiv, ast.Mod) and right == 0:
            raise ZeroDivisionError("Division by zero")
        if op_type == ast.Pow:
            if not isinstance(right, (int, float)) or abs(right) > 1000:
                raise ValueError("Exponent too large (maximum exponent is 1000)")
            if isinstance(left, (int, float)) and abs(left) > 10000 and abs(right) > 10:
                raise ValueError("Calculation too large to evaluate safely")
        return SAFE_OPERATORS[op_type](left, right)
    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPERATORS:
            raise ValueError(f"Unsupported operator: {op_type}")
        return SAFE_OPERATORS[op_type](safe_eval(node.operand))
    else:
        raise ValueError(f"Unsupported expression node: {type(node).__name__}")


class CalculatorTool(BaseTool):
    name = "calculator"
    description = "Perform precise mathematical calculations and arithmetic (e.g. 125 * 48, 2^16, (45 + 12) / 3)."
    parameters = {
        "expression": {
            "type": "string",
            "description": "Mathematical expression to evaluate, e.g. '125 * 48'",
            "required": True,
        }
    }
    requires_confirmation = False

    async def execute(self, arguments: Any) -> str:
        if isinstance(arguments, str):
            expr = arguments.strip()
        elif isinstance(arguments, dict):
            expr = str(
                arguments.get("expression")
                or arguments.get("expr")
                or arguments.get("input")
                or arguments.get("query")
                or arguments.get("math")
                or ""
            ).strip()
        else:
            expr = str(arguments).strip()

        if not expr:
            return "Error: Empty expression provided."

        # Replace visual symbols with standard operators
        clean_expr = expr.replace("×", "*").replace("÷", "/").replace("^", "**")

        try:
            tree = ast.parse(clean_expr, mode="eval")
            result = safe_eval(tree.body)
            # Format cleanly (int if whole number)
            if isinstance(result, float) and result.is_integer():
                result = int(result)
            return f"Result: {clean_expr} = {result}"
        except Exception as e:
            return f"Calculation error: {str(e)}"
