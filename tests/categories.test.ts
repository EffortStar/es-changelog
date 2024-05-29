import test from "tape";
import { Category } from "../src/types";
import { flattenCategories } from "../src/categories";

test("flattenCategories", (t) => {
  const a = [
    {
      emoji: "🗺️",
      title: "Level Generation",
      children: [
        {
          description: "Level Gen 1",
          mentions: [],
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
              mentions: [],
              children: [],
            },
          ],
        },
        ,
      ],
    },
  ] as Category[];

  const b = [
    {
      emoji: "😭",
      title: "level generation",
      children: [
        {
          description: "Level Gen 2",
          mentions: [],
          children: [],
        },
      ],
    },
    {
      emoji: "📰️",
      title: "Extra",
      children: [
        {
          description: "Extra 1",
          mentions: [],
          children: [],
        },
      ],
    },
  ] as Category[];

  t.deepEqual(flattenCategories([...a, ...b]), [
    {
      emoji: "🗺️",
      title: "Level Generation",
      children: [
        {
          description: "Level Gen 1",
          mentions: [],
          children: [],
        },
        {
          description: "Level Gen 2",
          mentions: [],
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
              mentions: [],
              children: [],
            },
          ],
        },
        ,
      ],
    },
    {
      emoji: "📰️",
      title: "Extra",
      children: [
        {
          description: "Extra 1",
          mentions: [],
          children: [],
        },
      ],
    },
  ]);

  t.end();
});
