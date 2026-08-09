# Fraction Food Truck

A browser-based educational game for practicing fractions, ratios, proportions, measurements, and recipe scaling.

## Run

### Easiest
Open `index.html` in a web browser.

### Local web server
From inside the folder:

```bash
python3 -m http.server 8091
```

Then open:

```text
http://127.0.0.1:8091
```

## Controls

- Click an answer and press **Serve Order**
- Number keys **1–4** choose an answer
- **Enter** serves the selected answer
- Use **Upgrade Truck** to spend earned money
- Use **End Shift** to see the grade report
- **Export Grade** saves the results as a `.txt` file

## Difficulty

- Easy: fractions and simplifying
- Medium: fractions, ratios, and measurements
- Hard: recipe scaling, mixed numbers, fractions, and ratios

Progress records are saved locally in the browser using localStorage.

## Grading

Each shift contains exactly **15 questions**. After question 15, the shift ends automatically and the student receives an A–F grade based on accuracy.
