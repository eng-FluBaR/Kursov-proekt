# 3D Jobs — Monorepo

Този репозиторий съдържа три подпроекта в monorepo структура:

- `3d-jobs-web` — Next.js уеб приложение
- `3d-jobs-mobile` — Expo / React Native приложение
- `3d-jobs-share` — споделени ресурси/код

Бързи команди:

```bash
# Инсталиране на всички зависимости (root workspaces)
npm install

# Стартиране на уеб приложението
npm run dev:web

# Стартиране на мобилното приложение (Expo)
npm run dev:mobile
```

Как да инициализирате git и да пушнете в GitHub (заменете потребител и repo):

```bash
git init
git add .
git commit -m "Initial monorepo"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

GitHub Actions: `.github/workflows/monorepo-ci.yml` билдва `3d-jobs-web` при push.
