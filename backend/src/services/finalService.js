const createFinal = async (amounts, currencyHint) => {
  try {
    console.log('Creating final output...');
    console.log('Amounts received:', amounts);
    console.log('Currency hint:', currencyHint);

    const amountsWithSource = amounts.map(item => {
      const sourceText = getSourceText(item.type, item.value, currencyHint);
      console.log('Generated source text:', sourceText);
      return {
        type: item.type,
        value: item.value,
        source: `text: '${sourceText}'`
      };
    });

    console.log('Final amounts with source:', amountsWithSource);

    return {
      currency: currencyHint || 'INR',
      amounts: amountsWithSource,
      status: 'ok'
    };
  } catch (error) {
    console.error('Error in createFinal:', error);
    throw new Error(`Final output creation failed: ${error.message}`);
  }
};


const getSourceText = (type, value, currency) => {
  const typeLabels = {
    'total_bill': 'Total',
    'paid': 'Paid',
    'due': 'Due',
    'discount': 'Discount',
    'consultation_fee': 'Consultation',
    'medicine': 'Medicine',
    'test': 'Tests',
    'procedure': 'Procedure',
    'other': 'Amount'
  };
  
  const label = typeLabels[type] || 'Amount';
  const currencySymbol = getCurrencySymbol(currency);
  
  return `${label}: ${currencySymbol} ${value}`;
};

const getCurrencySymbol = (currency) => {
  const symbols = {
    'INR': 'Rs',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  return symbols[currency] || currency;
};

const finalService = { createFinal };
export default finalService;