#!/usr/bin/env python3
"""Generate product-alignment-v1.pdf from product-alignment-v1.md using ReportLab."""

from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent
MD_PATH = ROOT / "product-alignment-v1.md"
PDF_PATH = ROOT / "product-alignment-v1.pdf"


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def inline_md(text: str) -> str:
    text = esc(text.strip())
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r'<font face="Courier">\1</font>', text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text


def parse_table(lines: list[str]) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in lines:
        if not line.strip().startswith("|"):
            break
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-+:?", c.replace(" ", "")) for c in cells):
            continue
        rows.append(cells)
    return rows


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "DocTitle",
            parent=base["Title"],
            fontSize=22,
            spaceAfter=12,
            textColor=colors.HexColor("#1a2b3c"),
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontSize=16,
            spaceBefore=16,
            spaceAfter=8,
            textColor=colors.HexColor("#1a2b3c"),
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontSize=13,
            spaceBefore=12,
            spaceAfter=6,
            textColor=colors.HexColor("#1c8db8"),
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=base["Heading3"],
            fontSize=11,
            spaceBefore=8,
            spaceAfter=4,
            textColor=colors.HexColor("#292929"),
        ),
        "h4": ParagraphStyle(
            "H4",
            parent=base["Heading4"],
            fontSize=10,
            spaceBefore=6,
            spaceAfter=3,
            textColor=colors.HexColor("#292929"),
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontSize=9.5,
            leading=13,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontSize=9.5,
            leading=13,
            leftIndent=14,
            bulletIndent=6,
            spaceAfter=3,
        ),
        "code": ParagraphStyle(
            "Code",
            parent=base["Code"],
            fontSize=8,
            leading=10,
            backColor=colors.HexColor("#f5efe8"),
            leftIndent=8,
            rightIndent=8,
        ),
        "meta": ParagraphStyle(
            "Meta",
            parent=base["BodyText"],
            fontSize=9,
            textColor=colors.HexColor("#5c5c5c"),
            spaceAfter=4,
        ),
    }


def table_flowable(rows: list[list[str]], styles) -> Table:
    data = [[Paragraph(inline_md(c), styles["body"]) for c in row] for row in rows]
    col_count = max(len(r) for r in data) if data else 1
    width = 17 * cm
    col_w = width / col_count
    t = Table(data, colWidths=[col_w] * col_count, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e3f4fb")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1a2b3c")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d0d0d0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#fdf8f3")],
                ),
            ]
        )
    )
    return t


def md_to_story(md_text: str, styles) -> list:
    story: list = []
    lines = md_text.splitlines()
    i = 0
    in_code = False
    code_buf: list[str] = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                story.append(Preformatted("\n".join(code_buf), styles["code"]))
                story.append(Spacer(1, 6))
                code_buf = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        if stripped == "---":
            story.append(Spacer(1, 4))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d0d0d0")))
            story.append(Spacer(1, 8))
            i += 1
            continue

        if stripped.startswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            rows = parse_table(table_lines)
            if rows:
                story.append(table_flowable(rows, styles))
                story.append(Spacer(1, 10))
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(inline_md(stripped[2:]), styles["title"]))
            i += 1
            continue
        if stripped.startswith("## "):
            story.append(Paragraph(inline_md(stripped[3:]), styles["h2"]))
            i += 1
            continue
        if stripped.startswith("### "):
            story.append(Paragraph(inline_md(stripped[4:]), styles["h3"]))
            i += 1
            continue
        if stripped.startswith("#### "):
            story.append(Paragraph(inline_md(stripped[5:]), styles["h4"]))
            i += 1
            continue

        if stripped.startswith("- [ ] ") or stripped.startswith("- [x] "):
            checked = stripped.startswith("- [x] ")
            label = stripped[6:]
            mark = "☑" if checked else "☐"
            story.append(Paragraph(f"{mark} {inline_md(label)}", styles["bullet"]))
            i += 1
            continue

        if stripped.startswith("- "):
            story.append(Paragraph(f"• {inline_md(stripped[2:])}", styles["bullet"]))
            i += 1
            continue

        if re.match(r"^\d+\.\s", stripped):
            story.append(Paragraph(inline_md(stripped), styles["bullet"]))
            i += 1
            continue

        if not stripped:
            story.append(Spacer(1, 4))
            i += 1
            continue

        story.append(Paragraph(inline_md(stripped), styles["body"]))
        i += 1

    return story


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#9a9a9a"))
    canvas.drawString(2 * cm, 1.2 * cm, "Let's Evaluate — Product Alignment v1.0")
    canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Page {doc.page}")
    canvas.restoreState()


def main():
    md_text = MD_PATH.read_text(encoding="utf-8")
    styles = build_styles()

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2.2 * cm,
        title="Let's Evaluate — Product Alignment",
        author="Let's Evaluate Team",
    )

    story = md_to_story(md_text, styles)
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Wrote {PDF_PATH}")


if __name__ == "__main__":
    main()
