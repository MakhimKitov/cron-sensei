import { explain } from "./core/explain";
import { nextRuns } from "./core/next";
import { CronParseError, parse } from "./core/parse";
import "./style.css";

const input = document.querySelector<HTMLInputElement>("#expression")!;
const description = document.querySelector<HTMLParagraphElement>("#description")!;
const runs = document.querySelector<HTMLOListElement>("#runs")!;

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function render(): void {
  const raw = input.value;
  if (!raw.trim()) {
    description.textContent = "Type a cron expression — e.g. 30 14 * * 1";
    description.classList.remove("error");
    runs.replaceChildren();
    return;
  }
  try {
    const expr = parse(raw);
    description.textContent = explain(expr);
    description.classList.remove("error");
    runs.replaceChildren(
      ...nextRuns(expr, new Date(), 5).map((run) => {
        const li = document.createElement("li");
        li.textContent = formatter.format(run);
        return li;
      }),
    );
  } catch (error) {
    if (!(error instanceof CronParseError)) throw error;
    description.textContent = error.message;
    description.classList.add("error");
    runs.replaceChildren();
  }
}

input.addEventListener("input", render);
render();
