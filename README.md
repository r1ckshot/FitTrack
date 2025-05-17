# FitTrack 🏃‍♂️ 🍎 📊

FitTrack to kompleksowa aplikacja do zarządzania treningami, dietą oraz śledzenia postępów. Umożliwia tworzenie planów treningowych i dietetycznych, monitorowanie postępów oraz przeprowadzanie zaawansowanych analiz korelacji między wskaźnikami zdrowotnymi a wskaźnikami społeczno-ekonomicznymi.

## Spis treści 📋

- [Funkcjonalności 🌟](#funkcjonalności-)
- [Wymagania systemowe 🖥️](#wymagania-systemowe-)
- [Konfiguracja baz danych 🗄️](#konfiguracja-baz-danych-)
- [Uruchamianie aplikacji 🚀](#uruchamianie-aplikacji-)
  - [Używanie Dockera 🐳](#używanie-dockera-)
  - [Uruchamianie bez Dockera ⚙️](#uruchamianie-bez-dockera-)
- [Klucze API 🔑](#klucze-api-)
- [Uwagi dotyczące MySQL 📝](#uwagi-dotyczące-mysql-)
- [Zrzuty ekranu 📷](#zrzuty-ekranu-)

## Funkcjonalności 🌟

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

## Wymagania systemowe 🖥️

### Do uruchomienia z Dockerem:
- Docker Engine 20.10+ i Docker Compose 2.0+
- 4GB RAM (zalecane)
- 2GB wolnego miejsca na dysku

### Do uruchomienia bez Dockera:
- Node.js 18.x+ (zalecane 22.x)
- MongoDB 4.4+ lub MySQL 8.0+ (lub obie)
- npm 8.x+

## Konfiguracja baz danych 🗄️

FitTrack oferuje elastyczną konfigurację baz danych, umożliwiając korzystanie z MongoDB, MySQL lub obu równocześnie.

### Wybór bazy danych

Konfiguracja odbywa się poprzez zmienną `DATABASE_TYPE` w pliku `backend/.env`:

```
# Możliwe wartości: mongo, mysql, both
DATABASE_TYPE=both
```

Ta zmienna określa, która baza danych będzie używana przez aplikację, niezależnie od tego, czy aplikacja jest uruchamiana z Dockerem czy bez.

### MongoDB
- Domyślny port: 27017
- Baza danych: fittrack
- Bez uwierzytelniania w trybie deweloperskim

### MySQL
- Domyślny port: 3306
- Baza danych: fittrack
- Użytkownik: fituser
- Hasło: fitpassword

## Uruchamianie aplikacji 🚀

### Używanie Dockera 🐳

Projekt jest w pełni zdockeryzowany, co pozwala na łatwe uruchomienie wszystkich komponentów z wybraną bazą danych.

#### Budowanie i uruchamianie aplikacji

1. **Najpierw należy ustawić odpowiednią wartość w pliku `backend/.env`**:
   ```
   DATABASE_TYPE=both  # lub mysql lub mongo
   ```

2. **Następnie można użyć profilów Docker Compose do budowania i uruchamiania wybranych usług**:

**Budowanie i uruchamianie tylko z MongoDB:**
```bash
docker-compose --profile mongo build
docker-compose --profile mongo up -d
```

**Budowanie i uruchamianie tylko z MySQL:**
```bash
docker-compose --profile mysql build
docker-compose --profile mysql up -d
```

**Budowanie i uruchamianie z obiema bazami danych:**
```bash
docker-compose --profile all build
docker-compose --profile all up -d
```

Możliwe jest też użycie domyślnego profilu, który uruchomi wszystkie usługi:
```bash
docker-compose build
docker-compose up -d
```

#### Zarządzanie kontenerami

```bash
# Zatrzymanie wszystkich kontenerów
docker-compose down

# Sprawdzenie statusu kontenerów
docker-compose ps

# Sprawdzenie logów backendu
docker-compose logs -f backend
```

### Uruchamianie bez Dockera ⚙️

#### Backend:
1. Należy przejść do katalogu backend:
```bash
cd backend
```

2. Zainstalować zależności:
```bash
npm install
```

3. Upewnić się, że uruchomiona jest odpowiednia baza danych (MongoDB i/lub MySQL) zgodnie z wartością `DATABASE_TYPE` w pliku `backend/.env`
   ```
   DATABASE_TYPE=both  # lub mysql lub mongo
   ```

4. Uruchomić serwer:
```bash
npm start
```

#### Frontend:
1. Należy przejść do katalogu frontend:
```bash
cd frontend
```

2. Zainstalować zależności:
```bash
npm install
```

3. Uruchomić aplikację:
```bash
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`, a API pod adresem `http://localhost:8080`.

## Klucze API 🔑

Aby w pełni korzystać z funkcjonalności aplikacji, konieczne jest uzyskanie kluczy API dla zewnętrznych usług:

### ExerciseDB API (dla planów treningowych)
1. Należy zarejestrować się na [RapidAPI](https://rapidapi.com/)
2. Uzyskać klucz API dla [ExerciseDB](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
3. Dodać klucz do pliku `frontend/.env`:
```
REACT_APP_EXERCISEDB_API_KEY=your_api_key
REACT_APP_EXERCISEDB_HOST=exercisedb.p.rapidapi.com
```

### Spoonacular API (dla planów dietetycznych)
1. Należy zarejestrować się na [RapidAPI](https://rapidapi.com/)
2. Uzyskać klucz API dla [Spoonacular](https://rapidapi.com/spoonacular/api/recipe-food-nutrition)
3. Dodać klucz do pliku `frontend/.env`:
```
REACT_APP_SPOONACULAR_API_KEY=your_api_key
REACT_APP_SPOONACULAR_HOST=spoonacular-recipe-food-nutrition-v1.p.rapidapi.com
```

## Uwagi dotyczące MySQL 📝

Projekt wykorzystuje MySQL 8.0 z domyślną metodą uwierzytelniania `caching_sha2_password`. W większości przypadków, przy korzystaniu z aktualnych narzędzi, połączenie powinno działać bez dodatkowej konfiguracji.

### Potencjalne problemy z połączeniem

Jeśli używana jest starsza wersja klienta MySQL (np. starsza wersja MySQL Workbench) i pojawią się problemy z połączeniem do bazy danych, może być konieczna zmiana metody uwierzytelniania:

```sql
# Połączenie z kontenerem MySQL
docker exec -it fittrack-mysql-1 mysql -u root -p
# (Należy wpisać hasło: password)

# Zmiana metody uwierzytelniania dla użytkownika fituser
ALTER USER 'fituser'@'%' IDENTIFIED WITH mysql_native_password BY 'fitpassword';

# Wyjście z konsoli MySQL
EXIT;
```

## Zrzuty ekranu 📷

*Tutaj będą dostępne zrzuty ekranu aplikacji*