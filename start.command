#!/bin/bash
# Запуск платформы — двойным кликом

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Проверяем node
if ! command -v node &>/dev/null; then
  osascript -e 'display dialog "Node.js не установлен. Установите его с https://nodejs.org" buttons {"OK"} default button "OK" with icon stop'
  exit 1
fi

# Проверяем зависимости
if [ ! -d "node_modules" ]; then
  osascript -e 'display dialog "Устанавливаем зависимости (первый запуск — займёт ~1 мин)..." buttons {"OK"} default button "OK"'
  npm install
fi

# Строим, если нет .next
if [ ! -d ".next" ]; then
  osascript -e 'display dialog "Собираем приложение (первый запуск — займёт ~1 мин)..." buttons {"OK"} default button "OK"'
  npm run build
fi

# Запускаем базу данных в фоне
echo "Запускаем базу данных..."
npx prisma dev &
PRISMA_PID=$!

# Ждём пока поднимется БД
sleep 4

# Применяем схему если нужно
npx prisma db push --skip-generate 2>/dev/null || true

# Заполняем тестовыми данными если первый запуск
if [ ! -f ".seeded" ]; then
  echo "Заполняем данными..."
  npm run db:seed && touch .seeded
fi

# Запускаем приложение
echo "Запускаем приложение..."
npm run start &
APP_PID=$!

# Ждём и открываем браузер
sleep 3
open "http://localhost:3000/store/gadget-market"

echo ""
echo "══════════════════════════════════════"
echo "  Платформа запущена!"
echo "  Витрина:  http://localhost:3000/store/gadget-market"
echo "  Админка:  http://localhost:3000/admin"
echo "  Логин:    admin@myshop.ru"
echo "  Пароль:   admin123"
echo "══════════════════════════════════════"
echo ""
echo "Нажмите Ctrl+C для остановки..."

# Ждём завершения
wait $APP_PID
kill $PRISMA_PID 2>/dev/null
