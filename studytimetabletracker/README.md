# CFA Level I Study Tracker

A personal study tracker for CFA Level I, built for GitHub Pages.

## 📁 File Structure

```
cfa-tracker/
├── index.html       ← Dashboard (study hours, rollover, heatmap)
├── subjects.html    ← All 10 subjects overview
├── subject.html     ← Individual subject with topic checklist
├── topic.html       ← Topic detail: notes + Q&A
├── data.json        ← YOUR CONTENT (edit this manually)
├── style.css        ← Styles (don't need to edit)
└── app.js           ← Logic (don't need to edit)
```

---

## 🚀 How to Deploy on GitHub Pages

1. Create a new GitHub repository (e.g. `cfa-tracker` or your personal site repo)
2. Upload all these files to the repository root
3. Go to **Settings → Pages → Source** and select `main` branch, `/ (root)`
4. Your site will be live at `https://yourusername.github.io/cfa-tracker/`

> ⚠️ The site uses `fetch('data.json')` which requires HTTP. It will NOT work if you just open HTML files locally with `file://`. Use GitHub Pages or a local server.

---

## ✏️ How to Add Notes & Questions

Open `data.json` in any text editor and find the topic you want. Fill in the `"notes"` and `"questions"` fields:

```json
{
  "id": 1,
  "name": "Time Value of Money",
  "notes": "Paste your full study notes here.\n\nYou can use multiple lines.\nUse \\n for line breaks in JSON.",
  "questions": [
    {
      "q": "What is the formula for future value?",
      "a": "FV = PV × (1 + r)^n"
    },
    {
      "q": "What does NPV stand for?",
      "a": "Net Present Value — the difference between the present value of cash inflows and outflows."
    }
  ]
}
```

After editing, **commit and push** to GitHub. Your site will update automatically.

---

## 📊 How the Study Tracker Works

### Daily Hours
- Enter how many hours you studied today on the Dashboard
- Click **Log Hours** to save it
- Data is saved to your browser's localStorage (stays on your device)

### Daily Goal & Rollover
- Set your daily minimum hours goal (e.g. 4 hours)
- If you study **less** than the goal, the missed hours **roll over** to the next day
- If you study **more**, the surplus **reduces** the next day's target
- Example: Goal = 4h. You study 2h on Monday → Tuesday target becomes 4 + 2 = **6h**

### Topic Checklist
- Click any topic row on a Subject page to mark it complete/incomplete
- Or use the checkbox on the left
- Completion data is saved in localStorage

### Heatmap
- Shows your last 90 days of study activity
- Darker blue = more hours studied that day

---

## 🔄 Data Storage

| Data | Storage | How to Backup |
|------|---------|---------------|
| Study hours log | Browser localStorage | Export manually if needed |
| Daily goal | Browser localStorage | — |
| Topic completions | Browser localStorage | — |
| Notes & Questions | `data.json` file | Saved in your GitHub repo ✅ |

---

## 📚 CFA Level I Subjects

| # | Subject | Topics |
|---|---------|--------|
| 1 | Ethical and Professional Standards | 5 |
| 2 | Quantitative Methods | 7 |
| 3 | Economics | 7 |
| 4 | Financial Statement Analysis | 11 |
| 5 | Corporate Issuers | 6 |
| 6 | Equity Investments | 6 |
| 7 | Fixed Income | 6 |
| 8 | Derivatives | 10 |
| 9 | Alternative Investments | 7 |
| 10 | Portfolio Management | 8 |
| | **Total** | **73** |
