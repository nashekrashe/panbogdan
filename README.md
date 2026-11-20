# Pan Bogdan: пакет для переезда

0. **AGENTS.md** и **TURNS.md**: правила для ИИ-агентов (Claude, ChatGPT), которые работают по очереди, и журнал ходов.
1. **HANDOFF.md**: всё о проекте. Бренд и домен, правила из чата, устройство кода, метод калькулятора ипотеки, план переезда на panbogdan.com, дальнейшие шаги.
2. **PROJECT_INSTRUCTIONS.md**: короткие инструкции для нового проекта, вставить в его настройки.
3. Код и сборка:

```bash
cd build && ./build.sh        # нужны python3 и node; npm install поставит terser, csso, jsdom
# dist/preview.html   самостоятельная страница, основа для panbogdan.com
# dist/poland-wp.html то, что лежит на pasha.by/poland
```

Сборка из этого пакета даёт байт-в-байт то же, что сейчас на pasha.by/poland (sha256 `6b8bef8d0b6d223b`, файл `deploy/live-base.html`).

Тесты: `cd tests && node mortval.js` (модель ипотеки на данных банков). Остальные тесты на Playwright открывают `dist/preview.html`.
