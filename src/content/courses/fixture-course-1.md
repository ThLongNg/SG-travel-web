---
slug: fixture-course-1
title: ダミーコース 2泊3日
nights: 2
days: 3
summary: ダミーのモデルコースです。
heroImage: ../../assets/content/fixture-course-1.webp
heroAlt: ダミー画像
themes: [food, walk]
estimatedCostJpy: { min: 30000, max: 50000, note: ダミー（航空券別） }
schedule:
  - day: 1
    title: ダミー1日目
    items:
      - {
          time: '09:00',
          title: ダミースポット・ワン,
          spot: fixture-spot-1,
          moveMinutes: 15,
          moveBy: Grab,
        }
      - {
          time: '12:00',
          title: ダミーランチ,
          note: ダミー,
          costVnd: 100000,
          moveMinutes: 10,
          moveBy: 徒歩,
        }
      - { time: '19:00', title: ダミー夜景 }
  - day: 2
    items:
      - { time: '08:00', title: ダミースポット・ツー, spot: fixture-spot-2 }
  - day: 3
    items:
      - { time: '10:00', title: ダミー出発 }
sources:
  - title: ダミー出典
    url: https://example.com/
lastVerified: 2026-11-11
verified: false
fixture: true
---

ダミー本文。
