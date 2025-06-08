# FitTrack 🏃‍♂️ 🍎 📊

FitTrack to kompleksowa aplikacja do zarządzania treningami, dietą oraz śledzenia postępów. Umożliwia tworzenie planów treningowych i dietetycznych, monitorowanie postępów oraz przeprowadzanie zaawansowanych analiz korelacji między wskaźnikami zdrowotnymi a wskaźnikami społeczno-ekonomicznymi.

![Image](https://github.com/user-attachments/assets/c5a4204a-c404-4aee-9ee2-e0cdf78a51fd)

## Spis treści 📋

- [Funkcjonalności 🌟](#funkcjonalności-)
- [Wymagania systemowe 🖥️](#wymagania-systemowe-)
- [Konfiguracja baz danych 🗄️](#konfiguracja-baz-danych-)
- [Uruchamianie aplikacji 🚀](#uruchamianie-aplikacji-)
  - [Używanie Dockera 🐳](#używanie-dockera-)
  - [Uruchamianie bez Dockera ⚙️](#uruchamianie-bez-dockera-)
- [Dokumentacja API 📚](#dokumentacja-api-)
- [Klucze API 🔑](#klucze-api-)
- [Uwagi dotyczące MySQL 📝](#uwagi-dotyczące-mysql-)

## Funkcjonalności 🌟

![Image](https://github.com/user-attachments/assets/42b19371-fc61-4798-a456-08054764c3a9)

### 1. Plany Treningowe 💪
- Tworzenie spersonalizowanych planów treningowych
- Organizacja treningów według dni tygodnia
- Dodawanie ćwiczeń ręcznie lub wyszukiwanie w bazie danych poprzez API ExerciseDB
- Szczegółowe informacje o ćwiczeniach: liczba serii, powtórzeń, ciężar i czas odpoczynku

<table>
  <tr>
    <td><img width="400" alt="Plany Treningowe" src="https://github.com/user-attachments/assets/97f45ae0-1ac0-4a0c-9cb9-2722cff3d7e0" /></td>
    <td><img width="400" alt="Wyszukiwanie ćwiczeń" src="https://github.com/user-attachments/assets/ed0f9b93-a9ae-4290-bb0f-4a7c632702c7" /></td>
  </tr>
</table>

### 2. Plany Dietetyczne 🥗
- Tworzenie planów żywieniowych
- Organizacja posiłków według dni
- Dodawanie własnych posiłków lub wyszukiwanie przepisów przez API Spoonacular
- Szczegółowe informacje o makroskładnikach: białko, węglowodany, tłuszcze i kalorie

<table>
  <tr>
    <td><img width="400" alt="Plany dietetyczne" src="https://github.com/user-attachments/assets/5c0a4d97-0db7-4046-a0ab-8f127eb634f1" /></td>
    <td><img width="400" alt="Wybór posiłków" src="https://github.com/user-attachments/assets/7a93cdb7-3204-425b-9b49-884091cc2a3b" /></td>
  </tr>
</table>

### 3. Śledzenie Postępów 📈
- Rejestrowanie wagi ciała
- Monitorowanie czasu treningów
- Wizualizacja postępów na wykresach w Dashboardzie
- Śledzenie metryk zdrowotnych w czasie

![Image](https://github.com/user-attachments/assets/ebf549ac-1d0c-471f-a8fc-02db2d9ea257)

### 4. Analizy Zdrowotne 🔍
- Łączenie i porównywanie danych z WHO i World Bank
- Analiza korelacji między wskaźnikami zdrowotnymi a społeczno-ekonomicznymi
- Wizualizacja danych na interaktywnych wykresach z możliwością wyboru kraju w określonym okresie czasu
**Typy analiz:**
  - Otyłość vs wydatki na ochronę zdrowia
  - PKB per capita vs aktywność fizyczna  
  - Prawdopodobieństwo zgonu vs urbanizacja
  - Cukrzyca vs nierówności dochodowe

<table>
  <tr>
    <td><img width="400" alt="Panel analiz zdrowotnych" src="https://github.com/user-attachments/assets/6e8fc5c1-b2c7-4048-8e35-c5f7a77bf387" /></td>
    <td><img width="400" alt="Wyniki analiz" src="https://github.com/user-attachments/assets/1a687208-bf1c-45d8-bdf5-529aef19ed27" /></td>
  </tr>
  <tr>
    <td colspan="2"><img width="400" alt="Zapisane analizy" src="https://github.com/user-attachments/assets/b47b1bf5-0554-4826-bb99-de12901389ea" /></td>
  </tr>
</table>

### 5. Profil Użytkownika 👤
- Zarządzanie danymi osobowymi
- Możliwość zmiany hasła
- Możliwość usunięcia konta wraz ze wszystkimi powiązanymi danymi 

![Image](https://github.com/user-attachments/assets/4a94bb6f-8379-4555-a2a4-afb22d3df41a)

### 6. Import i Eksport Danych 💾
- Obsługa formatów JSON, XML i YAML
- Importowanie i eksportowanie planów treningowych i dietetycznych
- Importowanie i eksportowanie przeprowadzonych analiz

## Wymagania systemowe 🖥️

### Do uruchomienia z Dockerem:
- Docker Engine 20.10+ i Docker Compose 2.0+
- 4GB RAM (zalecane)
- Wymagania dyskowe:
  - Aplikacja (frontend + backend): ~2.6GB
  - MongoDB: ~1.2GB
  - MySQL: ~1.1GB
  - Łącznie przy użyciu obu baz danych: ~5GB
  - Łącznie przy użyciu tylko jednej bazy: ~3.8GB (z MongoDB) lub ~3.7GB (z MySQL)

### Do uruchomienia bez Dockera:
- Node.js 18.x+ (zalecane 22.x)
- MongoDB 4.4+ lub MySQL 8.0+ (lub obie)
- npm 8.x+

## Konfiguracja baz danych 🗄️

FitTrack oferuje elastyczną konfigurację baz danych, umożliwiając korzystanie z MongoDB, MySQL lub obu równocześnie.

### Wybór bazy danych

Konfiguracja odbywa się poprzez zmienną `DATABASE_TYPE` w pliku `backend/.env`:

```env
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

1. Najpierw należy ustawić odpowiednią wartość w pliku `backend/.env`:
   ```env
   DATABASE_TYPE=both  # lub mysql lub mongo
   ```

2. Następnie można użyć profilów Docker Compose do budowania i uruchamiania wybranych usług:

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

#### Zarządzanie kontenerami

```bash
# Zatrzymanie wszystkich kontenerów (z odpowiednim profilem)
docker-compose --profile mongo down
docker-compose --profile mysql down
docker-compose --profile all down

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

3. Skonfigurować plik `backend/.env` dla lokalnego uruchomienia:
```env
# Dla MongoDB
MONGODB_URI=mongodb://localhost:27017/fittrack

# Dla MySQL
MYSQL_HOST=localhost
MYSQL_DATABASE=fittrack
MYSQL_USER=fituser
MYSQL_PASSWORD=fitpassword

# Wybór bazy danych
DATABASE_TYPE=both  # lub mysql lub mongo
```

4. Upewnić się, że lokalne bazy danych są uruchomione:
   - Dla MongoDB: usługa MongoDB działa na porcie 27017
   - Dla MySQL (np. przez XAMPP): usługa MySQL działa na porcie 3306

5. W przypadku korzystania z MySQL, należy utworzyć bazę danych i użytkownika:
   ```sql
   CREATE DATABASE fittrack;
   CREATE USER 'fituser'@'localhost' IDENTIFIED BY 'fitpassword';
   GRANT ALL PRIVILEGES ON fittrack.* TO 'fituser'@'localhost';
   ```

6. Uruchomić serwer:
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

## Dokumentacja API 📚

![Image](https://github.com/user-attachments/assets/2c36048e-47fe-442d-a060-1ac31e90d6e7)

Po uruchomieniu aplikacji, kompletna dokumentacja wszystkich dostępnych tras API znajduje się pod adresem:
**`http://localhost:8080/public/api-docs.html`**

Dokumentacja zawiera:
- Listę wszystkich 34 tras API
- Kolorowe oznaczenia metod HTTP (GET, POST, PUT, DELETE)
- Informacje o trasach wymagających autoryzacji
- Podział na 6 głównych modułów funkcjonalnych
- Opisy funkcjonalności każdej trasy

## Klucze API 🔑

Aby w pełni korzystać z funkcjonalności aplikacji, konieczne jest uzyskanie kluczy API dla zewnętrznych usług:

### ExerciseDB API (dla planów treningowych)
1. Należy zarejestrować się na [RapidAPI](https://rapidapi.com/)
2. Uzyskać klucz API dla [ExerciseDB](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
3. Dodać klucz do pliku `frontend/.env`:
```env
REACT_APP_EXERCISEDB_API_KEY=your_api_key
REACT_APP_EXERCISEDB_HOST=exercisedb.p.rapidapi.com
```

### Spoonacular API (dla planów dietetycznych)
1. Należy zarejestrować się na [RapidAPI](https://rapidapi.com/)
2. Uzyskać klucz API dla [Spoonacular](https://rapidapi.com/spoonacular/api/recipe-food-nutrition)
3. Dodać klucz do pliku `frontend/.env`:
```env
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