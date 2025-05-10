const axios = require('axios');
const NodeCache = require('node-cache');

class WHOApiService {
  constructor() {
    this.baseUrl = 'https://ghoapi.azureedge.net/api';
    // Inicjalizacja cache z czasem życia 1 godzina (3600 sekund)
    this.cache = new NodeCache({ stdTTL: 3600 });
  }

  /**
   * Pobiera wskaźniki zdrowotne z API WHO
   */
  async getHealthIndicator(indicator, countryCode, yearStart, yearEnd) {
    // Tworzenie unikalnego klucza dla cachowania
    const cacheKey = `who-${indicator}-${countryCode}-${yearStart}-${yearEnd}`;
    
    // Sprawdź, czy dane znajdują się w cache
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Budowa URL z parametrami
      const url = `${this.baseUrl}/${indicator}`;
      
      const response = await axios.get(url, {
        params: {
          $filter: `SpatialDim eq '${countryCode}' and TimeDim ge ${yearStart} and TimeDim le ${yearEnd}`,
          $orderby: 'TimeDim asc'
        }
      });
      
      const result = response.data.value || [];
      
      // Zapisz dane w cache
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching WHO data:', error.message);
      throw new Error(`Failed to fetch WHO data: ${error.message}`);
    }
  }

  /**
   * Pobiera dane o otyłości (BMI >= 30)
   */
  async getObesityData(countryCode, yearStart, yearEnd) {
    // NCD_BMI_30A: Prewalencja otyłości wśród dorosłych, BMI ≥ 30 (szacowanie standaryzowane względem wieku) (%)
    return this.getHealthIndicator('NCD_BMI_30A', countryCode, yearStart, yearEnd);
  }
  
  /**
   * Pobiera dane o prawdopodobieństwie zgonu
   */
  async getDeathProbabilityData(countryCode, yearStart, yearEnd) {
    // NCDMORT3070: Prawdopodobieństwo (%) zgonu w wieku 30–70 lat z powodu chorób układu krążenia, nowotworów, cukrzycy lub chorób układu oddechowego
    return this.getHealthIndicator('NCDMORT3070', countryCode, yearStart, yearEnd);
  }
  
  /**
   * Pobiera dane o cukrzycy
   */
  async getDiabetesData(countryCode, yearStart, yearEnd) {
    // NCD_GLUC_04: Podwyższony poziom glukozy we krwi (≥ 7,0 mmol/L) (szacowanie standaryzowane względem wieku)
    return this.getHealthIndicator('NCD_GLUC_04', countryCode, yearStart, yearEnd);
  }
  
  /**
   * Pobiera dane o aktywności fizycznej
   */
  async getPhysicalActivityData(countryCode, yearStart, yearEnd) {
    // NCD_PAA: Prewalencja niewystarczającej aktywności fizycznej wśród dorosłych (18+) (szacowanie standaryzowane względem wieku) (%)
    return this.getHealthIndicator('NCD_PAA', countryCode, yearStart, yearEnd);
  }
  
  /**
   * Pobiera listę dostępnych krajów
   */
  async getCountries() {
    // Klucz cache dla listy krajów
    const cacheKey = 'who-countries-list';
    
    // Sprawdź czy dane są w cache
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/DIMENSION/COUNTRY/DimensionValues`);
      const result = response.data.value.map(country => ({
        code: country.Code,
        name: country.Title
      }));
      
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
    const cacheKey = `who-years-${indicator}-${countryCode}`;
    
    // Sprawdź czy dane są w cache
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const url = `${this.baseUrl}/${indicator}`;
      
      const response = await axios.get(url, {
        params: {
          $filter: `SpatialDim eq '${countryCode}'`,
          $select: 'TimeDim'
        }
      });
      
      // Wyciągnij unikalne lata
      const years = [...new Set(response.data.value.map(item => item.TimeDim))];
      const result = years.sort();
      
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

module.exports = WHOApiService;