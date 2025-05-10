const axios = require('axios');
const NodeCache = require('node-cache');

class WorldBankApiService {
  constructor() {
    this.baseUrl = 'https://api.worldbank.org/v2';
    this.format = 'json';
    // Inicjalizacja cache z czasem życia 1 godzina (3600 sekund)
    this.cache = new NodeCache({ stdTTL: 3600 });
  }

  /**
   * Pobiera dane ekonomiczne z API World Bank
   */
  async getEconomicIndicator(indicator, countryCode, yearStart, yearEnd) {
    // Tworzenie unikalnego klucza dla cachowania
    const cacheKey = `indicator-${indicator}-${countryCode}-${yearStart}-${yearEnd}`;
    
    // Sprawdź, czy dane znajdują się w cache
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const url = `${this.baseUrl}/country/${countryCode}/indicator/${indicator}`;

      const response = await axios.get(url, {
        params: {
          date: `${yearStart}:${yearEnd}`,
          format: this.format,
          per_page: 100 // Maksymalna liczba wyników na stronę
        }
      });

      // World Bank API zwraca dane w specyficznej strukturze [metadata, data]
      let result = [];
      if (Array.isArray(response.data) && response.data.length > 1) {
        result = response.data[1].map(item => ({
          year: item.date,
          value: item.value,
          country: item.country.value,
          indicator: {
            id: item.indicator.id,
            name: item.indicator.value
          }
        }));
      }

      // Zapisz dane w cache
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching World Bank data:', error.message);
      throw new Error(`Failed to fetch World Bank data: ${error.message}`);
    }
  }

  /**
   * Pobiera dane PKB per capita
   */
  async getGDPPerCapita(countryCode, yearStart, yearEnd) {
    // NY.GDP.PCAP.CD: PKB na mieszkańca (bieżący USD)
    return this.getEconomicIndicator('NY.GDP.PCAP.CD', countryCode, yearStart, yearEnd);
  }

  /**
   * Pobiera dane o wydatkach na ochronę zdrowia jako % PKB
   */
  async getHealthExpenditureData(countryCode, yearStart, yearEnd) {
    // SH.XPD.CHEX.GD.ZS: Bieżące wydatki na ochronę zdrowia (% PKB)
    return this.getEconomicIndicator('SH.XPD.CHEX.GD.ZS', countryCode, yearStart, yearEnd);
  }

  /**
   * Pobiera dane o poziomie urbanizacji
   */
  async getUrbanizationData(countryCode, yearStart, yearEnd) {
    // SP.URB.TOTL.IN.ZS: Ludność miejska (% całkowitej populacji)
    return this.getEconomicIndicator('SP.URB.TOTL.IN.ZS', countryCode, yearStart, yearEnd);
  }

  /**
   * Pobiera dane o nierównościach dochodowych (wskaźnik Giniego)
   */
  async getGiniIndexData(countryCode, yearStart, yearEnd) {
    // SI.POV.GINI: Wskaźnik Giniego
    return this.getEconomicIndicator('SI.POV.GINI', countryCode, yearStart, yearEnd);
  }

  /**
   * Pobiera listę dostępnych krajów
   */
  async getCountries() {
    // Klucz cache dla listy krajów
    const cacheKey = 'countries-list';
    
    // Sprawdź czy dane są w cache
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/country`, {
        params: {
          format: this.format,
          per_page: 300 // Uzyskaj wszystkie kraje
        }
      });

      let result = [];
      if (Array.isArray(response.data) && response.data.length > 1) {
        result = response.data[1].map(country => ({
          code: country.id,
          name: country.name,
          region: country.region.value
        }));
      }

      // Zapisz dane w cache
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching countries:', error.message);
      throw new Error(`Failed to fetch countries: ${error.message}`);
    }
  }
  
  /**
   * Pobiera dostępne lata dla danego wskaźnika i kraju
   */
  async getAvailableYears(indicator, countryCode) {
    // Klucz cache dla dostępnych lat
    const cacheKey = `years-${indicator}-${countryCode}`;
    
    // Sprawdź czy dane są w cache
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const url = `${this.baseUrl}/country/${countryCode}/indicator/${indicator}`;

      const response = await axios.get(url, {
        params: {
          format: this.format,
          per_page: 100 // Pobierz większą liczbę wyników, aby uzyskać więcej lat
        }
      });

      let result = [];
      // World Bank API zwraca dane w strukturze [metadata, data]
      if (Array.isArray(response.data) && response.data.length > 1) {
        // Wyciągnij wszystkie lata i odfiltruj te z wartościami null
        const years = response.data[1]
          .filter(item => item.value !== null)
          .map(item => item.date);

        // Zwróć unikalne lata posortowane
        result = [...new Set(years)].sort();
      }

      // Zapisz dane w cache
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching available years:', error.message);
      throw new Error(`Failed to fetch available years: ${error.message}`);
    }
  }
  
  /**
   * Czyści cache
   */
  clearCache() {
    this.cache.flushAll();
  }
  
  /**
   * Czyści konkretny klucz z cache
   */
  clearCacheKey(key) {
    this.cache.del(key);
  }
}

module.exports = WorldBankApiService;