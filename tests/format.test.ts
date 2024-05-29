import test from "tape";
import { Category } from "../src/types";
import { formatCategories } from "../src/format";

test("formatCategories", (t) => {
  const categories = [
    {
      emoji: "🗺️",
      title: "Level Generation",
      children: [
        {
          description: "Level Gen 1",
          mentions: ["boss"],
          children: [],
        },
      ],
    },
    {
      emoji: "🖼️",
      title: "Art",
      children: [
        {
          description: "Art 1",
          mentions: [],
          children: [
            {
              description: "Art 1.1",
              mentions: ["foo"],
              children: [],
            },
          ],
        },
        { description: "Art 2", mentions: ["bar"], children: [] },
        ,
      ],
    },
  ] as Category[];

  const expected = `- 🗺️ Level Generation
  - Level Gen 1 (Reported by @boss)
- 🖼️ Art
  - Art 1
    - Art 1.1 (Reported by @foo)
  - Art 2 (Reported by @bar)
`;

  t.equal(formatCategories(categories), expected);

  t.end();
});
