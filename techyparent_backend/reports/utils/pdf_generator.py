from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4


def generate_pdf(file_path, child, summary_data, weekly_data, recommendations):
    doc = SimpleDocTemplate(file_path, pagesize=A4)

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'title',
        parent=styles['Title'],
        fontSize=20,
        alignment=1,
        spaceAfter=20
    )

    header_style = ParagraphStyle(
        'header',
        parent=styles['Heading2'],
        textColor=colors.HexColor("#3b82f6"),
        spaceBefore=10,
        spaceAfter=10
    )

    content = []

    # ========================
    # 1. TITLE PAGE
    # ========================
    content.append(Paragraph("📊 Child Progress Report", title_style))
    content.append(Paragraph(f"Child: {child.name}", styles['Normal']))
    content.append(Paragraph(f"Report Generated: {summary_data.get('date', '')}", styles['Normal']))
    content.append(Spacer(1, 20))

    # ========================
    # 2. SUMMARY CARDS
    # ========================
    content.append(Paragraph("Summary Overview", header_style))

    summary_table_data = [
        ["Screen Time", summary_data.get("screen_time_today", "0")],
        ["Videos Watched", summary_data.get("videos_watched_total", 0)],
        ["Goals Achieved", summary_data.get("goals_achieved_total", 0)],
        ["Engagement Level", summary_data.get("engagement_level", "Low")],
    ]

    summary_table = Table(summary_table_data, colWidths=[200, 200])

    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0f2fe")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    content.append(summary_table)
    content.append(Spacer(1, 20))

    # ========================
    # 3. WEEKLY DATA TABLE
    # ========================
    content.append(Paragraph("Weekly Activity", header_style))

    week_table_data = [["Day", "Screen Time (min)", "Videos", "Engagement"]]

    for day in weekly_data:
        week_table_data.append([
            day["label"],
            str(day["screen_time_minutes"]),
            str(day["videos_watched"]),
            str(day["engagement_score"]),
        ])

    week_table = Table(week_table_data)

    week_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))

    content.append(week_table)
    content.append(Spacer(1, 20))

    # ========================
    # 4. RECOMMENDATIONS
    # ========================
    content.append(Paragraph("Recommendations", header_style))

    for rec in recommendations:
        content.append(Paragraph(f"• {rec.title}", styles['Normal']))
        content.append(Paragraph(rec.description, styles['Normal']))
        content.append(Spacer(1, 8))

    # Build PDF
    doc.build(content)