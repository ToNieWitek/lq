# LQ-HUB - Instrukcja konfiguracji i darmowego wdrożenia 24/7 (Vercel + Supabase)

Projekt to kompletna aplikacja internetowa do prezentacji liquidów (**Elfliq**, **Vozol**, **Puffy**), z panelem kupującego i rozbudowanym panelem administratora.

---

## 1. Uruchomienie lokalne (już działa)

Aplikacja posiada wbudowany tryb **Demo / Offline**, co oznacza, że możesz ją odpalić i w pełni przetestować lokalnie:

```bash
npm run dev
```

Strona będzie dostępna pod adresem: `http://localhost:3000`

### Gotowe konta do logowania w trybie testowym:
- **Panel Administratora**: `admin@example.com` / hasło: `admin123`
  - Daje dostęp do `/admin`: dodawanie/edycja smaków, 1-klik przełączanie dostępności, wklejanie linków do zdjęć, tworzenie i przydzielanie zamówień oraz tworzenie kont kupujących z generowaniem haseł.
- **Panel Kupującego**: `klient@example.com` / hasło: `kupujacy123`
  - Daje dostęp do `/panel`: podgląd przypisanych zamówień, numerów i aktualnych statusów (W realizacji, Wysłane, Do odbioru, itp.).

---

## 2. Krok po kroku: Darmowa baza 24/7 w Supabase

1. Wejdź na [https://supabase.com](https://supabase.com) i kliknij **Start your project** (zaloguj się np. przez GitHub).
2. Kliknij **New project**, wpisz dowolną nazwę (np. `lq-hub`), ustaw bezpieczne hasło do bazy i wybierz region najbliżej Polski (np. `Frankfurt / Central EU`).
3. Po utworzeniu projektu przejdź w lewym menu do zakładki **SQL Editor**.
4. Otwórz plik `supabase-schema.sql` z tego projektu, skopiuj całą jego zawartość, wklej do edytora w Supabase i kliknij zielony przycisk **Run**.
   - Utworzy to tabele: `brands`, `products`, `profiles`, `orders`, polityki bezpieczeństwa RLS oraz początkowe produkty.
5. Pobierz klucze dostępowe:
   - W Supabase wejdź w **Project Settings** (ikona zębatki w lewym dolnym rogu) -> **API**.
   - Skopiuj:
     - **Project URL**
     - **Project API Keys -> `anon` / `public`**
     - **Project API Keys -> `service_role`** (tajny klucz serwerowy do tworzenia kont)
6. Wklej te wartości do pliku `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=twoj-url-z-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj-klucz-anon
   SUPABASE_SERVICE_ROLE_KEY=twoj-klucz-service-role
   ```

---

## 3. Krok po kroku: Darmowy hosting 24/7 na Vercel

1. Wrzuć kod projektu na swoje konto **GitHub** (jako prywatne lub publiczne repozytorium):
   ```bash
   git add .
   git commit -m "Wersja gotowa do wdrożenia"
   git branch -M main
   git remote add origin https://github.com/twoj-login/twoje-repo.git
   git push -u origin main
   ```
2. Wejdź na [https://vercel.com](https://vercel.com) i zaloguj się kontem GitHub.
3. Kliknij **Add New...** -> **Project** i zaimportuj repozytorium z GitHub.
4. W sekcji **Environment Variables** dodaj 3 zmienne (te same co w punkcie 2):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Kliknij **Deploy**.
6. Po 1-2 minutach otrzymasz darmowy link działający 24/7 (np. `https://twoj-projekt.vercel.app`), z darmowym certyfikatem SSL i możliwością podpięcia własnej domeny.
