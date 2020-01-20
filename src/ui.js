import {mapSamples, calculateLuminance, calculateIrradiance, interpolateData} from './rows.js'
import {downloadCSVButton} from './csvExport.js'
import Chart from 'chart.js'

const asExponential = (number) => number.toExponential(2)
const asDecimal = (number) => number.toFixed(2)

const conversionFunction = (areaSelect, powerSelect) => {
  const areaScale = parseFloat(areaSelect.options[areaSelect.selectedIndex].value)
  const powerScale = parseFloat(powerSelect.options[powerSelect.selectedIndex].value)
  return (wavelength, sample) =>  sample / powerScale * areaScale
}

const appendCells = (table, cellType, cells) => {
  const row = document.createElement("tr")
  const domCells = cells.map((cellText) =>  {
    const cell = document.createElement(cellType)
    const text = document.createTextNode(cellText)
    cell.appendChild(text)
    return cell
  })
  for (const cell of domCells) {
    row.appendChild(cell)
  }
  table.appendChild(row)
  return domCells
}

const createSampleTableHeader = (table, sampleCount) => {
  const titles = ["Wavelength [nm]", "Spectral irradiance [W/(m² nm)]"]
  const cells = appendCells(table, "th", titles)
  cells[1].setAttribute("colspan", sampleCount)
}

const createTableHeader = (table, sampleCount) => {
  const sampleTitles = new Array(sampleCount).fill("").map((_, index) => "S"+index)
  const titles = ["Condition", ...sampleTitles]
  appendCells(table, "th", titles)
}

const createTableRow = (table, wavelength, samples, formatter) => {
  const formattedSamples = samples.map(formatter)
  appendCells(table, "td", [wavelength, ...formattedSamples])
}

const createCalculationTable = (table, rows, sampleCount) => {
  createTableHeader(table, sampleCount)

  const luminanceTotals = calculateLuminance(rows, sampleCount)
  const sConeTotals = calculateIrradiance(rows, sampleCount, 'sCone')
  const mConeTotals = calculateIrradiance(rows, sampleCount, 'mCone')
  const lConeTotals = calculateIrradiance(rows, sampleCount, 'lCone')
  const rodTotals = calculateIrradiance(rows, sampleCount, 'rod')
  const melTotals = calculateIrradiance(rows, sampleCount, 'mel')
  createTableRow(table, "Illuminance [lux]", luminanceTotals, asDecimal)
  createTableRow(table, "S-cone-opic irradiance (mW/m²)", sConeTotals, asDecimal)
  createTableRow(table, "M-cone-opic irradiance (mW/m²)", mConeTotals, asDecimal)
  createTableRow(table, "L-cone-opic irradiance (mW/m²)", lConeTotals, asDecimal)
  createTableRow(table, "Rhodopic irradiance (mW/m²)", rodTotals, asDecimal)
  createTableRow(table, "Melanopic irradiance (mW/m²)", melTotals, asDecimal)
}

const createSpectrumTable = (table, rows, sampleCount) => {
  createSampleTableHeader(table, sampleCount)
  for (const row of rows) {
    const [wavelength, ...samples] = row
    createTableRow(table, wavelength, samples, asExponential)
  }
}

const createDownloadButtons = (element, calculationTable, spectrumTable) => {
  const calcCSVButton = downloadCSVButton(calculationTable, "btn btn-primary", "download-calc", "Download calculation CSV")
  element.appendChild(calcCSVButton);
  const spectrumCSVButton = downloadCSVButton(spectrumTable, "btn btn-primary", "download-spectrum", "Download spectrum CSV")
  element.appendChild(spectrumCSVButton);
}

/* eslint-disable max-lines-per-function */
const createChart = (chartCanvas, rows) => {
  const xAxislabels = []
  const datasets = []
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
    const row = rows[rowIdx]
    const [wavelength, ...samples] = row
    xAxislabels.push(wavelength)
    for (let sampleIdx = 0; sampleIdx < samples.length; sampleIdx += 1) {
      if (rowIdx === 0) {
        const r = Math.ceil(Math.random() * 16).toString(16)
        const g = Math.ceil(Math.random() * 16).toString(16)
        const b = Math.ceil(Math.random() * 16).toString(16)
        const lineColor = '#' + r + g + b
        datasets[sampleIdx] = {
          'backgroundColor': lineColor,
          'borderColor': lineColor,
          'data': [],
          'fill': false,
          'label': 'S' + sampleIdx,
          'pointRadius': 1
        }
      }
      const sample = samples[sampleIdx]
      datasets[sampleIdx].data.push(sample)
    }
  }

  new Chart(chartCanvas, { // eslint-disable-line no-new
    'data': {
      datasets,
      'labels': xAxislabels
    },
    'options': {
      'scales': {
        'xAxes': [
          {
            'gridLines': {
              'display': false
            },
            'scaleLabel': {
              'display': true,
              'labelString': 'Wavelength [nm]'
            }
          }
        ],
        'yAxes': [
          {
            'scaleLabel': {
              'display': true,
              'labelString': 'Spectral irradiance [W/(m² nm)]'
            }
          }
        ]
      }
    },
    'type': 'line'
  });
}
/* eslint-enable max-lines-per-function */

export const createTables = (rawRows, sampleCount, spectrumTable, calculationTable, areaUnitSelect, powerUnitSelect, footerButtons, chartCanvas) => {
  const unitConversion = conversionFunction(areaUnitSelect, powerUnitSelect)
  const rows = mapSamples(rawRows, unitConversion)
  const interpolatedRows = interpolateData(rows, sampleCount)

  createCalculationTable(calculationTable, interpolatedRows, sampleCount)
  createChart(chartCanvas, interpolatedRows)
  createSpectrumTable(spectrumTable, rows, sampleCount)
  createDownloadButtons(footerButtons, calculationTable, spectrumTable)
}

export const createErrorTable = (errors, fileUploadedSection) => {
  const header = document.createElement('p')
  const textNode = document.createTextNode('We had some problems understanding that file:')
  header.appendChild(textNode)
  fileUploadedSection.appendChild(header)
  const table = document.createElement('table')
  table.setAttribute('class', 'errors')
  table.setAttribute('class', 'table')

  for (const error of errors) {
    const row = document.createElement('tr')

    const rowNum = document.createElement('td')
    const rowNumText = document.createTextNode(`line ${error.row}`)
    rowNum.appendChild(rowNumText)

    const message = document.createElement('td')
    const messageText = document.createTextNode(error.message)
    message.appendChild(messageText)

    row.appendChild(rowNum)
    row.appendChild(message)

    table.appendChild(row)
  }
  fileUploadedSection.appendChild(table)
}
