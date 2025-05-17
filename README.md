# FitTrack 🏃‍♂️ 🍎 📊

FitTrack to kompleksowa aplikacja do zarządzania treningami, dietą oraz śledzenia postępów. Umożliwia tworzenie planów treningowych i dietetycznych, monitorowanie postępów oraz przeprowadzanie zaawansowanych analiz korelacji między wskaźnikami zdrowotnymi a wskaźnikami społeczno-ekonomicznymi.

## Spis treści

- [Funkcjonalności](#funkcjonalności)
- [Wymagania systemowe](#wymagania-systemowe)
- [Uruchamianie aplikacji](#uruchamianie-aplikacji)
  - [Używanie Dockera](#używanie-dockera)
  - [Uruchamianie bez Dockera](#uruchamianie-bez-dockera)
- [Konfiguracja baz danych](#konfiguracja-baz-danych)
- [Klucze API](#klucze-api)
- [Uwagi dotyczące MySQL](#uwagi-dotyczące-mysql)
- [Zrzuty ekranu](#zrzuty-ekranu)

## Funkcjonalności

### 1. Plany Treningowe 💪
- Tworzenie spersonalizowanych planów treningowych
- Organizacja treningów według dni tygodnia
- Dodawanie ćwiczeń ręcznie lub wyszukiwanie w bazie danych poprzez API ExerciseDB
- Szczegółowe informacje o ćwiczeniach: liczba serii, powtórzeń, ciężar i czas odpoczynku

### 2. Plany Dietetyczne 🥗
- Tworzenie planów żywieniowych
- Organizacja posiłków według dni
- Dodawanie własnych posiłków lub wyszukiwanie przepisów przez API Spoonacular
- Szczegółowe informacje o makroskładnikach: białko, węglowodany, tłuszcze i kalorie

### 3. Śledzenie Postępów 📈
- Rejestrowanie wagi ciała
- Monitorowanie czasu treningów
- Wizualizacja postępów na wykresach
- Śledzenie metryk zdrowotnych w czasie

### 4. Analizy Zdrowotne 🔍
- Łączenie i porównywanie danych z WHO i World Bank
- Analiza korelacji między wskaźnikami zdrowotnymi a społeczno-ekonomicznymi
- Wizualizacja danych na interaktywnych wykresach
- Typy analiz:
  - Otyłość vs wydatki na ochronę zdrowia: Czy kraje wydające więcej na ochronę zdrowia mają niższe wskaźniki otyłości?
  - PKB per capita vs aktywność fizyczna: Czy zamożność społeczeństwa przekłada się na większą aktywność fizyczną?
  - Prawdopodobieństwo zgonu vs urbanizacja: Czy w bardziej zurbanizowanych krajach częściej występują choroby serca?
  - Cukrzyca vs nierówności dochodowe: Czy większe nierówności dochodowe wiążą się z częstszym występowaniem cukrzycy?

### 5. Import i Eksport Danych 💾
- Obsługa formatów JSON, XML i YAML
- Importowanie i eksportowanie planów treningowych i dietetycznych
- Importowanie i eksportowanie przeprowadzonych analiz

## Wymagania systemowe

### Do uruchomienia z Dockerem:
- Docker Engine 20.10+ i Docker Compose 2.0+
- 4GB RAM (zalecane)
- 2GB wolnego miejsca na dysku

### Do uruchomienia bez Dockera:
- Node.js 18.x+ (zalecane 22.x)
- MongoDB 4.4+ lub MySQL 8.0+ (lub obie)
- npm 8.x+

## Uruchamianie aplikacji

### Używanie Dockera

Projekt jest w pełni zdockeryzowany, co pozwala na łatwe uruchomienie wszystkich komponentów. Docker automatycznie zainstaluje wszystkie zależności z plików package.json, więc nie musisz instalować ich lokalnie:

1. Uruchomienie całej aplikacji:
```bash
docker-compose up -d
```

2. Zatrzymanie całej aplikacji:
```bash
docker-compose down
```

3. Zarządzanie poszczególnymi usługami:
```bash
# Zatrzymanie tylko frontendu
docker-compose stop frontend

# Restart tylko backendu
docker-compose restart backend

# Sprawdzenie logów backendu
docker-compose logs -f backend
```

4. Przebudowanie kontenerów (w przypadku zmian w konfiguracji):
```bash
docker-compose build
```

#### Konfiguracja Docker dla pojedynczej bazy danych

Domyślnie docker-compose.yml uruchamia zarówno MongoDB jak i MySQL. Aby uruchomić aplikację tylko z jedną bazą danych:

**Tylko MongoDB:**
```bash
docker-compose up -d mongodb backend frontend
```

**Tylko MySQL:**
```bash
docker-compose up -d mysql backend frontend
```

Pamiętaj, aby dostosować zmienną `DATABASE_TYPE` w pliku `backend/.env` odpowiednio do wybranej bazy danych.

### Uruchamianie bez Dockera

#### Backend:
1. Przejdź do katalogu backend:
```bash
cd backend
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Upewnij się, że masz uruchomioną bazę danych (MongoDB i/lub MySQL)

4. Skonfiguruj plik `.env` (przykład w repozytorium)

5. Uruchom serwer:
```bash
npm start
```

#### Frontend:
1. Przejdź do katalogu frontend:
```bash
cd frontend
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj plik `.env` (przykład w repozytorium)

4. Uruchom aplikację:
```bash
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`, a API pod adresem `http://localhost:8080`.

## Konfiguracja baz danych

FitTrack oferuje elastyczną konfigurację baz danych, umożliwiając korzystanie z MongoDB, MySQL lub obu równocześnie.

Konfiguracja odbywa się poprzez zmienną `DATABASE_TYPE` w pliku `backend/.env`:

```
# Możliwe wartości: mongo, mysql, both
DATABASE_TYPE=both
```

### MongoDB
- Domyślny port: 27017
- Baza danych: fittrack
- Bez uwierzytelniania w trybie deweloperskim

### MySQL
- Domyślny port: 3306
- Baza danych: fittrack
- Użytkownik: fituser
- Hasło: fitpassword

## Klucze API

Aby w pełni korzystać z funkcjonalności aplikacji, konieczne jest uzyskanie kluczy API dla zewnętrznych usług:

### ExerciseDB API (dla planów treningowych)
1. Zarejestruj się na [RapidAPI](https://rapidapi.com/)
2. Uzyskaj klucz API dla [ExerciseDB](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
3. Dodaj klucz do pliku `frontend/.env`:
```
REACT_APP_EXERCISEDB_API_KEY=your_api_key
REACT_APP_EXERCISEDB_HOST=exercisedb.p.rapidapi.com
```

### Spoonacular API (dla planów dietetycznych)
1. Zarejestruj się na [RapidAPI](https://rapidapi.com/)
2. Uzyskaj klucz API dla [Spoonacular](https://rapidapi.com/spoonacular/api/recipe-food-nutrition)
3. Dodaj klucz do pliku `frontend/.env`:
```
REACT_APP_SPOONACULAR_API_KEY=your_api_key
REACT_APP_SPOONACULAR_HOST=spoonacular-recipe-food-nutrition-v1.p.rapidapi.com
```

## Uwagi dotyczące MySQL

Projekt wykorzystuje MySQL 8.0 z domyślną metodą uwierzytelniania `caching_sha2_password`. W większości przypadków, przy korzystaniu z aktualnych narzędzi, połączenie powinno działać bez dodatkowej konfiguracji.

### Potencjalne problemy z połączeniem

Jeśli używasz starszej wersji klienta MySQL (np. starsza wersja MySQL Workbench) i napotkasz problemy z połączeniem do bazy danych, może być konieczna zmiana metody uwierzytelniania:

## Zrzuty ekranu

*Tutaj będą dostępne zrzuty ekranu aplikacji*