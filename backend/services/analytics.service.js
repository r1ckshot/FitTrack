const WHOApiService = require('./who.service');
const WorldBankApiService = require('./world.bank.service');

class AnalyticsService {
  constructor() {
    this.whoService = new WHOApiService();
    this.worldBankService = new WorldBankApiService();
  }

  /**
   * Oblicza współczynnik korelacji Pearsona między dwoma zestawami danych
   */
  calculateCorrelation(x, y) {
    // Jeśli brak danych lub nie są równej długości, zwróć null
    if (!x || !y || x.length !== y.length || x.length === 0) {
      return null;
    }

    const n = x.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }

    // Wzór na współczynnik korelacji Pearsona
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  /**
   * Łączy dane z obu API na podstawie roku
   */
  mergeDatasets(healthData, economicData) {
    const healthDataMap = new Map();
    const economicDataMap = new Map();

    // Przetwarzanie danych WHO 
    healthData.forEach(item => {
      if (item.Dim1 === 'SEX_BTSX' && (item.Dim2 === 'AGEGROUP_YEARS18-PLUS' || item.Dim2 === 'AGEGROUP_YEARS30-69')) { // Tylko dane dla obu płci i wieku 18+ lub 30-69
        const year = parseInt(item.TimeDim || item.year);
        const value = parseFloat(item.NumericValue || item.value);

        if (!isNaN(year) && !isNaN(value)) {
          healthDataMap.set(year, value);
        }
      }
    });

    // Przetwarzanie danych World Bank
    economicData.forEach(item => {
      const year = parseInt(item.year);
      const value = parseFloat(item.value);

      if (!isNaN(year) && !isNaN(value)) {
        economicDataMap.set(year, value);
      }
    });

    // Znajdź wspólne lata
    const commonYears = [...healthDataMap.keys()]
      .filter(year => economicDataMap.has(year))
      .sort((a, b) => a - b);

    // Przygotuj ostateczne dane
    const mergedData = commonYears.map(year => ({
      year,
      healthValue: healthDataMap.get(year),
      economicValue: economicDataMap.get(year)
    }));

    // Oblicz korelację tylko jeśli są dane
    const correlation = mergedData.length >= 2
      ? this.calculateCorrelation(
        mergedData.map(d => d.healthValue),
        mergedData.map(d => d.economicValue)
      )
      : null;

      console.log('Merged Data:', mergedData);

    return {
      mergedData,
      correlation,
      commonYears
    };
  }

  /**
   * Generuje wynik analizy na podstawie typu analizy i wartości korelacji
   */
  generateAnalysisResult(analysisType, correlation, mergedData) {
    if (correlation === null) return "Brak wystarczających danych do interpretacji wyników.";

    // Sprawdzamy, czy dane mają trend wzrostowy czy spadkowy
    const firstYearHealthValue = mergedData[0]?.healthValue;
    const lastYearHealthValue = mergedData[mergedData.length - 1]?.healthValue;
    const firstYearEconomicValue = mergedData[0]?.economicValue;
    const lastYearEconomicValue = mergedData[mergedData.length - 1]?.economicValue;

    const healthTrendIncreasing = lastYearHealthValue > firstYearHealthValue;
    const economicTrendIncreasing = lastYearEconomicValue > firstYearEconomicValue;

    // Określenie scenariusza trendu
    let scenario = '';
    if (healthTrendIncreasing && economicTrendIncreasing) {
      scenario = 'both_increase';
    } else if (!healthTrendIncreasing && !economicTrendIncreasing) {
      scenario = 'both_decrease';
    } else if (healthTrendIncreasing && !economicTrendIncreasing) {
      scenario = 'health_increase_economic_decrease';
    } else {
      scenario = 'health_decrease_economic_increase';
    }

    switch (analysisType) {
      case "obesity_vs_health_expenditure": {
        if (correlation < 0) {
          switch (scenario) {
            case 'both_increase':
              return "Ujemna korelacja przy wzroście obu wskaźników może sugerować, że pomimo rosnących wydatków na ochronę zdrowia, tempo wzrostu otyłości jest wolniejsze w okresach większych nakładów - wskazuje to na pewną skuteczność interwencji zdrowotnych, choć niewystarczającą do zatrzymania trendu.";
            case 'both_decrease':
              return "Ujemna korelacja przy spadku obu wskaźników sugeruje, że zmniejszenie wydatków na ochronę zdrowia wiąże się z szybszym spadkiem wskaźnika otyłości - to nieoczekiwany wynik, który może wskazywać na inne czynniki mające większy wpływ na zdrowie populacji.";
            case 'health_increase_economic_decrease':
              return "Ujemna korelacja przy wzroście otyłości i spadku wydatków na zdrowie sugeruje, że ograniczanie nakładów na ochronę zdrowia może przyczyniać się do wzrostu problemu otyłości - wskazuje to na znaczenie finansowania programów profilaktyki zdrowotnej.";
            case 'health_decrease_economic_increase':
              return "Ujemna korelacja przy spadku otyłości i wzroście wydatków na zdrowie sugeruje, że zwiększone nakłady na ochronę zdrowia przynoszą pozytywne rezultaty w walce z otyłością - potwierdza to skuteczność inwestycji w zdrowie publiczne.";
          }
        } else {
          switch (scenario) {
            case 'both_increase':
              return "Dodatnia korelacja przy wzroście obu wskaźników sugeruje, że zwiększone wydatki na ochronę zdrowia są prawdopodobnie reakcją na rosnący problem otyłości - może to wskazywać, że inwestycje są odpowiedzią na istniejący problem, a nie skuteczną prewencją.";
            case 'both_decrease':
              return "Dodatnia korelacja przy spadku obu wskaźników sugeruje, że zmniejszenie wydatków na ochronę zdrowia wiąże się ze spadkiem wskaźnika otyłości - może to wskazywać na większą rolę innych czynników społeczno-ekonomicznych w kształtowaniu zdrowia populacji.";
            case 'health_increase_economic_decrease':
              return "Dodatnia korelacja przy wzroście otyłości i spadku wydatków na zdrowie sugeruje, że zmniejszone nakłady na ochronę zdrowia mogą przyczyniać się do nasilenia problemu otyłości - wskazuje to na potencjalne konsekwencje cięć w budżetach zdrowotnych.";
            case 'health_decrease_economic_increase':
              return "Dodatnia korelacja przy spadku otyłości i wzroście wydatków na zdrowie sugeruje, że zwiększone nakłady są skuteczne w walce z otyłością - potwierdza to, że odpowiednie finansowanie programów zdrowotnych przynosi oczekiwane efekty.";
          }
        }
        break;
      }

      case "gdp_vs_physical_activity": {
        // Uwaga: dane WHO dotyczą NIEWYSTARCZAJĄCEJ aktywności fizycznej
        if (correlation < 0) {
          switch (scenario) {
            case 'both_increase':
              return "Ujemna korelacja przy wzroście obu wskaźników sugeruje, że pomimo rosnącego PKB per capita, zwiększa się wskaźnik niewystarczającej aktywności fizycznej, ale w tempie wolniejszym niż można by oczekiwać - może to wskazywać na pozytywny wpływ pewnych aspektów wzrostu gospodarczego na świadomość zdrowotną.";
            case 'both_decrease':
              return "Ujemna korelacja przy spadku obu wskaźników sugeruje, że spadek PKB per capita wiąże się z szybszym spadkiem niewystarczającej aktywności fizycznej - może to wskazywać, że w trudniejszych warunkach ekonomicznych ludzie prowadzą bardziej aktywny fizycznie tryb życia.";
            case 'health_increase_economic_decrease':
              return "Ujemna korelacja przy wzroście niewystarczającej aktywności fizycznej i spadku PKB sugeruje, że pogarszająca się sytuacja ekonomiczna może paradoksalnie spowalniać wzrost bierności fizycznej - wskazuje to na złożone zależności między zamożnością a stylem życia.";
            case 'health_decrease_economic_increase':
              return "Ujemna korelacja przy spadku niewystarczającej aktywności fizycznej i wzroście PKB sugeruje, że rozwój gospodarczy sprzyja większej aktywności fizycznej - może to być wynikiem większych możliwości rekreacyjnych i lepszej edukacji zdrowotnej w bogatszych społeczeństwach.";
          }
        } else {
          switch (scenario) {
            case 'both_increase':
              return "Dodatnia korelacja przy wzroście obu wskaźników sugeruje, że wzrost PKB per capita wiąże się ze wzrostem niewystarczającej aktywności fizycznej - wskazuje to na bardziej siedzący tryb życia w miarę rozwoju gospodarczego i wzrostu zamożności społeczeństwa.";
            case 'both_decrease':
              return "Dodatnia korelacja przy spadku obu wskaźników sugeruje, że spadek PKB per capita wiąże się ze spadkiem niewystarczającej aktywności fizycznej - może to wskazywać, że w trudniejszych warunkach ekonomicznych ludzie mają mniejszą skłonność do siedzącego trybu życia.";
            case 'health_increase_economic_decrease':
              return "Dodatnia korelacja przy wzroście niewystarczającej aktywności fizycznej i spadku PKB sugeruje, że nawet w okresie pogorszenia sytuacji gospodarczej trend siedzącego trybu życia może się nasilać - może to wskazywać na utrwalone wzorce zachowań niezależne od bieżącej sytuacji ekonomicznej.";
            case 'health_decrease_economic_increase':
              return "Dodatnia korelacja przy spadku niewystarczającej aktywności fizycznej i wzroście PKB sugeruje, że pomimo ogólnej tendencji do mniej aktywnego trybu życia w bogatszych społeczeństwach, ten konkretny okres pokazuje odwrotny trend - może to być wynikiem skutecznych programów promujących aktywność fizyczną.";
          }
        }
        break;
      }

      case "death_probability_vs_urbanization": {
        if (correlation < 0) {
          switch (scenario) {
            case 'both_increase':
              return "Ujemna korelacja przy wzroście obu wskaźników sugeruje, że pomimo rosnącej urbanizacji, tempo wzrostu prawdopodobieństwa zgonu z powodu chorób niezakaźnych jest niższe - może to wskazywać na lepszy dostęp do specjalistycznej opieki zdrowotnej w miastach pomimo innych negatywnych czynników.";
            case 'both_decrease':
              return "Ujemna korelacja przy spadku obu wskaźników sugeruje, że spadek poziomu urbanizacji wiąże się z wolniejszym spadkiem prawdopodobieństwa zgonu - może to wskazywać na lepszy dostęp do opieki zdrowotnej w miastach w porównaniu z obszarami wiejskimi.";
            case 'health_increase_economic_decrease':
              return "Ujemna korelacja przy wzroście prawdopodobieństwa zgonu i spadku urbanizacji sugeruje, że zmniejszanie się populacji miejskiej może wiązać się z ograniczonym dostępem do specjalistycznej opieki zdrowotnej - wskazuje to na potencjalne nierówności w dostępie do usług medycznych.";
            case 'health_decrease_economic_increase':
              return "Ujemna korelacja przy spadku prawdopodobieństwa zgonu i wzroście urbanizacji sugeruje, że wyższy poziom urbanizacji wiąże się z lepszymi wynikami zdrowotnymi - może to wynikać z lepszego dostępu do opieki zdrowotnej, edukacji i programów profilaktycznych w miastach.";
          }
        } else {
          switch (scenario) {
            case 'both_increase':
              return "Dodatnia korelacja przy wzroście obu wskaźników sugeruje, że rosnący poziom urbanizacji wiąże się ze wzrostem prawdopodobieństwa zgonu z powodu chorób niezakaźnych - może to wskazywać na negatywny wpływ miejskiego stylu życia (stres, zanieczyszczenie, siedzący tryb życia).";
            case 'both_decrease':
              return "Dodatnia korelacja przy spadku obu wskaźników sugeruje, że spadek poziomu urbanizacji wiąże się ze spadkiem prawdopodobieństwa zgonu z powodu chorób niezakaźnych - może to wskazywać na zdrowsze warunki życia poza dużymi ośrodkami miejskimi.";
            case 'health_increase_economic_decrease':
              return "Dodatnia korelacja przy wzroście prawdopodobieństwa zgonu i spadku urbanizacji sugeruje, że czynniki ryzyka dla chorób niezakaźnych mogą narastać pomimo spadku poziomu urbanizacji - wskazuje to na złożone zależności między miejscem zamieszkania a zdrowiem.";
            case 'health_decrease_economic_increase':
              return "Dodatnia korelacja przy spadku prawdopodobieństwa zgonu i wzroście urbanizacji sugeruje, że pomimo ogólnej tendencji do gorszych wyników zdrowotnych w miastach, ten okres pokazuje poprawę - może to być wynikiem skutecznych programów zdrowia publicznego w obszarach miejskich.";
          }
        }
        break;
      }

      case "diabetes_vs_gini_index": {
        if (correlation < 0) {
          switch (scenario) {
            case 'both_increase':
              return "Ujemna korelacja przy wzroście obu wskaźników sugeruje, że pomimo rosnącej prewalencji cukrzycy, jej wzrost jest wolniejszy w okresach większych nierówności dochodowych - to nieoczekiwany wynik wymagający głębszej analizy, być może związany z czynnikami kulturowymi lub behawioralnymi.";
            case 'both_decrease':
              return "Ujemna korelacja przy spadku obu wskaźników sugeruje, że zmniejszanie się nierówności dochodowych wiąże się z wolniejszym spadkiem prewalencji cukrzycy - to nieoczekiwany wynik, który może wskazywać na inne istotne czynniki wpływające na rozpowszechnienie tej choroby.";
            case 'health_increase_economic_decrease':
              return "Ujemna korelacja przy wzroście prewalencji cukrzycy i spadku wskaźnika Giniego sugeruje, że spadek nierówności dochodowych wiąże się ze wzrostem występowania cukrzycy - to zaskakujący wynik, który może sugerować zmiany w stylu życia lub dostępie do określonych produktów żywnościowych.";
            case 'health_decrease_economic_increase':
              return "Ujemna korelacja przy spadku prewalencji cukrzycy i wzroście wskaźnika Giniego sugeruje, że większe nierówności dochodowe wiążą się z niższą prewalencją cukrzycy - to nieoczekiwany wynik wymagający dodatkowych badań nad specyficznymi czynnikami społeczno-ekonomicznymi.";
          }
        } else {
          switch (scenario) {
            case 'both_increase':
              return "Dodatnia korelacja przy wzroście obu wskaźników sugeruje, że rosnące nierówności dochodowe wiążą się ze wzrostem prewalencji cukrzycy - może to wskazywać na ograniczony dostęp do zdrowej żywności i opieki zdrowotnej wśród grup o niższych dochodach.";
            case 'both_decrease':
              return "Dodatnia korelacja przy spadku obu wskaźników sugeruje, że zmniejszenie nierówności dochodowych wiąże się ze spadkiem prewalencji cukrzycy - potwierdza to pozytywny wpływ bardziej egalitarnego rozkładu dochodów na zdrowie publiczne.";
            case 'health_increase_economic_decrease':
              return "Dodatnia korelacja przy wzroście prewalencji cukrzycy i spadku wskaźnika Giniego sugeruje, że pomimo zmniejszających się nierówności dochodowych, inne czynniki przyczyniają się do wzrostu zachorowalności na cukrzycę - wskazuje to na potrzebę kompleksowego podejścia do profilaktyki tej choroby.";
            case 'health_decrease_economic_increase':
              return "Dodatnia korelacja przy spadku prewalencji cukrzycy i wzroście wskaźnika Giniego sugeruje, że pomimo rosnących nierówności dochodowych, inne czynniki przyczyniają się do spadku zachorowalności na cukrzycę - wskazuje to na złożoność determinantów zdrowia publicznego.";
          }
        }
        break;
      }

      default:
        return "Brak interpretacji dla tego typu analizy.";
    }
  }

  /**
   * Analiza 1: Korelacja między otyłością a wydatkami na ochronę zdrowia
   */
  async analyzeObesityVsHealthExpenditure(countryCode, yearStart, yearEnd) {
    try {
      const obesityData = await this.whoService.getObesityData(countryCode, yearStart, yearEnd);
      const healthExpenditureData = await this.worldBankService.getHealthExpenditureData(countryCode, yearStart, yearEnd);

      const analysis = this.mergeDatasets(obesityData, healthExpenditureData);

      return {
        title: "Porównanie między prewalencją otyłości (BMI ≥ 30, standaryzowana) a wydatkami na ochronę zdrowia (% PKB)",
        description: "Analiza związku między prewalencją otyłości wśród dorosłych (BMI ≥ 30, standaryzowana względem wieku) a udziałem wydatków na ochronę zdrowia w PKB",
        country: countryCode,
        period: `${yearStart}-${yearEnd}`,
        correlation: analysis.correlation,
        correlationInterpretation: this.interpretCorrelation(analysis.correlation),
        result: this.generateAnalysisResult("obesity_vs_health_expenditure", analysis.correlation, analysis.mergedData),
        datasets: {
          years: analysis.commonYears,
          healthData: analysis.mergedData.map(item => item.healthValue),
          economicData: analysis.mergedData.map(item => item.economicValue)
        },
        rawData: analysis.mergedData,
        analysisType: "obesity_vs_health_expenditure"
      };
    } catch (error) {
      console.error('Analysis error:', error.message);
      throw new Error(`Failed to perform analysis: ${error.message}`);
    }
  }

  /**
   * Analiza 2: Wpływ PKB per capita na poziom aktywności fizycznej
   */
  async analyzeGDPVsPhysicalActivity(countryCode, yearStart, yearEnd) {
    try {
      const physicalActivityData = await this.whoService.getPhysicalActivityData(countryCode, yearStart, yearEnd);
      const gdpData = await this.worldBankService.getGDPPerCapita(countryCode, yearStart, yearEnd);

      const analysis = this.mergeDatasets(physicalActivityData, gdpData);

      return {
        title: "Wpływ PKB per capita na prewalencję niewystarczającej aktywności fizycznej (standaryzowanej)",
        description: "Badanie związku między PKB per capita a odsetkiem dorosłych z niewystarczającą aktywnością fizyczną (standaryzowaną względem wieku)",
        country: countryCode,
        period: `${yearStart}-${yearEnd}`,
        correlation: analysis.correlation,
        correlationInterpretation: this.interpretCorrelation(analysis.correlation),
        result: this.generateAnalysisResult("gdp_vs_physical_activity", analysis.correlation, analysis.mergedData),
        datasets: {
          years: analysis.commonYears,
          healthData: analysis.mergedData.map(item => item.healthValue),
          economicData: analysis.mergedData.map(item => item.economicValue)
        },
        rawData: analysis.mergedData,
        analysisType: "gdp_vs_physical_activity"
      };
    } catch (error) {
      console.error('Analysis error:', error.message);
      throw new Error(`Failed to perform analysis: ${error.message}`);
    }
  }

  /**
   * Analiza 3: Porównanie prawdopodobieństwa zgonu z poziomem urbanizacji
   */
  async analyzeDeathProbabilityVsUrbanization(countryCode, yearStart, yearEnd) {
    try {
      const deathProbabilityData = await this.whoService.getDeathProbabilityData(countryCode, yearStart, yearEnd);
      const urbanizationData = await this.worldBankService.getUrbanizationData(countryCode, yearStart, yearEnd);

      const analysis = this.mergeDatasets(deathProbabilityData, urbanizationData);

      return {
        title: "Porównanie prawdopodobieństwa zgonu (30–70 lat) z NCD z poziomem urbanizacji",
        description: "Analiza związku między prawdopodobieństwem zgonu w wieku 30–70 lat z powodu chorób układu krążenia, nowotworów, cukrzycy lub chorób oddechowych a odsetkiem ludności miejskiej",
        country: countryCode,
        period: `${yearStart}-${yearEnd}`,
        correlation: analysis.correlation,
        correlationInterpretation: this.interpretCorrelation(analysis.correlation),
        result: this.generateAnalysisResult("death_probability_vs_urbanization", analysis.correlation, analysis.mergedData),
        datasets: {
          years: analysis.commonYears,
          healthData: analysis.mergedData.map(item => item.healthValue),
          economicData: analysis.mergedData.map(item => item.economicValue)
        },
        rawData: analysis.mergedData,
        analysisType: "death_probability_vs_urbanization"
      };
    } catch (error) {
      console.error('Analysis error:', error.message);
      throw new Error(`Failed to perform analysis: ${error.message}`);
    }
  }

  /**
   * Analiza 4: Analiza nierówności dochodowych (wskaźnik Giniego) w kontekście cukrzycy
   */
  async analyzeDiabetesVsGiniIndex(countryCode, yearStart, yearEnd) {
    try {
      const diabetesData = await this.whoService.getDiabetesData(countryCode, yearStart, yearEnd);
      const giniData = await this.worldBankService.getGiniIndexData(countryCode, yearStart, yearEnd);

      const analysis = this.mergeDatasets(diabetesData, giniData);

      return {
        title: "Wpływ nierówności dochodowych (wskaźnik Giniego) na prewalencję cukrzycy (standaryzowaną)",
        description: "Analiza relacji między wskaźnikiem Giniego a odsetkiem osób z podwyższonym poziomem glukozy we krwi (≥ 7,0 mmol/L, standaryzowanym względem wieku)",
        country: countryCode,
        period: `${yearStart}-${yearEnd}`,
        correlation: analysis.correlation,
        correlationInterpretation: this.interpretCorrelation(analysis.correlation),
        result: this.generateAnalysisResult("diabetes_vs_gini_index", analysis.correlation, analysis.mergedData),
        datasets: {
          years: analysis.commonYears,
          healthData: analysis.mergedData.map(item => item.healthValue),
          economicData: analysis.mergedData.map(item => item.economicValue)
        },
        rawData: analysis.mergedData,
        analysisType: "diabetes_vs_gini_index"
      };
    } catch (error) {
      console.error('Analysis error:', error.message);
      throw new Error(`Failed to perform analysis: ${error.message}`);
    }
  }

  /**
   * Interpretuje wartość współczynnika korelacji
   */
  interpretCorrelation(correlation) {
    if (correlation === null) return "Brak wystarczających danych do obliczenia korelacji";

    const absCorrelation = Math.abs(correlation);
    let interpretation = "";

    if (absCorrelation >= 0.9) {
      interpretation = "Bardzo silna ";
    } else if (absCorrelation >= 0.7) {
      interpretation = "Silna ";
    } else if (absCorrelation >= 0.5) {
      interpretation = "Umiarkowana ";
    } else if (absCorrelation >= 0.3) {
      interpretation = "Słaba ";
    } else if (absCorrelation > 0) {
      interpretation = "Bardzo słaba ";
    } else {
      return "Brak korelacji";
    }

    interpretation += correlation > 0 ? "korelacja dodatnia" : "korelacja ujemna";
    return interpretation;
  }

  /**
   * Pobiera dostępne kraje z obu API i zwraca część wspólną
   */
  async getAvailableCountries() {
    try {
      const whoCountries = await this.whoService.getCountries();
      const worldBankCountries = await this.worldBankService.getCountries();

      // Znajdź wspólne kraje na podstawie kodów
      const whoCountryMap = new Map(whoCountries.map(country => [country.code, country]));
      const commonCountries = worldBankCountries.filter(country => whoCountryMap.has(country.code));

      return commonCountries.map(country => ({
        code: country.code,
        name: country.name,
        region: country.region
      }));
    } catch (error) {
      console.error('Error fetching available countries:', error.message);
      throw new Error(`Failed to fetch available countries: ${error.message}`);
    }
  }

  /**
   * Wykonuje analizę na podstawie określonego typu
   */
  async performAnalysis(analysisType, countryCode, yearStart, yearEnd) {
    switch (analysisType) {
      case "obesity_vs_health_expenditure":
        return this.analyzeObesityVsHealthExpenditure(countryCode, yearStart, yearEnd);
      case "gdp_vs_physical_activity":
        return this.analyzeGDPVsPhysicalActivity(countryCode, yearStart, yearEnd);
      case "death_probability_vs_urbanization":
        return this.analyzeDeathProbabilityVsUrbanization(countryCode, yearStart, yearEnd);
      case "diabetes_vs_gini_index":
        return this.analyzeDiabetesVsGiniIndex(countryCode, yearStart, yearEnd);
      default:
        throw new Error(`Nieznany typ analizy: ${analysisType}`);
    }
  }

  /**
   * Znajduje wspólne lata dostępne dla wskaźników z obu API dla danego kraju
   */
  async getCommonAvailableYears(countryCode, analysisType) {
    try {
      // Określanie wskaźników na podstawie typu analizy
      let whoIndicator, worldBankIndicator;

      switch (analysisType) {
        case 'obesity_vs_health_expenditure':
          whoIndicator = 'NCD_BMI_30A';
          worldBankIndicator = 'SH.XPD.CHEX.GD.ZS';
          break;
        case 'gdp_vs_physical_activity':
          whoIndicator = 'NCD_PAA';
          worldBankIndicator = 'NY.GDP.PCAP.CD';
          break;
        case 'death_probability_vs_urbanization':
          whoIndicator = 'NCDMORT3070';
          worldBankIndicator = 'SP.URB.TOTL.IN.ZS';
          break;
        case 'diabetes_vs_gini_index':
          whoIndicator = 'NCD_GLUC_04';
          worldBankIndicator = 'SI.POV.GINI';
          break;
        default:
          throw new Error(`Nieznany typ analizy: ${analysisType}`);
      }

      // Pobieranie dostępnych lat z obu API
      const whoYears = await this.whoService.getAvailableYears(whoIndicator, countryCode);
      const worldBankYears = await this.worldBankService.getAvailableYears(worldBankIndicator, countryCode);

      // Konwersja lat do liczb całkowitych dla porównania
      const whoYearsInt = whoYears.map(year => parseInt(year));
      const worldBankYearsInt = worldBankYears.map(year => parseInt(year));

      // Znalezienie wspólnych lat
      const commonYears = whoYearsInt.filter(year => worldBankYearsInt.includes(year));

      if (commonYears.length === 0) {
        return {
          minYear: null,
          maxYear: null,
          availableYears: []
        };
      }

      // Sortowanie lat
      commonYears.sort((a, b) => a - b);

      return {
        minYear: commonYears[0],
        maxYear: commonYears[commonYears.length - 1],
        availableYears: commonYears
      };
    } catch (error) {
      console.error('Error fetching common available years:', error.message);
      throw new Error(`Failed to fetch common available years: ${error.message}`);
    }
  }
}

module.exports = AnalyticsService;