document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('converter');
  const inputTemp = document.getElementById('input-temp');
  const inputUnit = document.getElementById('input-unit');
  const outputUnit = document.getElementById('output-unit');
  const outputTemp = document.getElementById('output-temp');
  console.log("Should be grabbing data at the beginning 1")

  // Load form data from IndexedDB (via the service worker) when the page loads
  if (navigator.serviceWorker.controller) {
    console.log("Should be grabbing data at the beginning 2")
    navigator.serviceWorker.controller.postMessage({ action: 'get-form-data' });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.action === 'set-form-data') {
        const { temperature, fromUnit, toUnit } = event.data;
        inputTemp.value = temperature;
        inputUnit.value = fromUnit;
        outputUnit.value = toUnit;

        updateOutput();
      }
    });
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log("Message received from Service Worker:", event.data);
  });

  // Event listener to update output temperature and send form data to service worker
  form.addEventListener('input', () => {
    console.log("event listener hit")
    updateOutput();
    saveFormData();
  });

  function updateOutput() {
    const temperature = parseFloat(inputTemp.value);
    const from = inputUnit.value;
    const to = outputUnit.value;

    console.log("Update output")
    console.log(`inputTemp: ${temperature}  inputValue: ${from}  outputUnit: ${to}`)
    let convertedTemp;

    if (from === 'c') {
      if (to === 'f') {
        convertedTemp = (temperature * 9/5) + 32;
      } else if (to === 'k') {
        convertedTemp = temperature + 273.15;
      }
    } else if (from === 'f') {
      if (to === 'c') {
        convertedTemp = (temperature - 32) * 5/9;
      } else if (to === 'k') {
        convertedTemp = (temperature - 32) * 5/9 + 273.15;
      }
    } else if (from === 'k') {
      if (to === 'c') {
        convertedTemp = temperature - 273.15;
      } else if (to === 'f') {
        convertedTemp = (temperature - 273.15) * 9/5 + 32;
      }
    }

    outputTemp.value = `${convertedTemp} ${to.toUpperCase()}`;
  }

  async function saveFormData() {
    if (navigator.serviceWorker.controller) {
      const temperature = inputTemp.value;
      const fromUnit = inputUnit.value;
      const toUnit = outputUnit.value;
      console.log("Should be saving here")

      navigator.serviceWorker.controller.postMessage({
        action: 'save-form-data',
        temperature,
        fromUnit,
        toUnit,
      });
    }
  }
});