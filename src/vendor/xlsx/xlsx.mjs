const textEncoder = new TextEncoder();

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const createZip = (entries) => {
  const fileParts = [];
  const centralParts = [];
  let offset = 0;

  const writeUint16 = (value) => {
    const buffer = new Uint8Array(2);
    buffer[0] = value & 0xff;
    buffer[1] = (value >>> 8) & 0xff;
    return buffer;
  };

  const writeUint32 = (value) => {
    const buffer = new Uint8Array(4);
    buffer[0] = value & 0xff;
    buffer[1] = (value >>> 8) & 0xff;
    buffer[2] = (value >>> 16) & 0xff;
    buffer[3] = (value >>> 24) & 0xff;
    return buffer;
  };

  entries.forEach((entry) => {
    const nameBytes = textEncoder.encode(entry.name);
    const data = entry.binary ? entry.data : textEncoder.encode(entry.data);
    const crc = crc32(data);
    const size = data.length;

    const localHeader = [
      textEncoder.encode('PK\u0003\u0004'),
      writeUint16(20),
      writeUint16(0),
      writeUint16(0),
      writeUint16(0),
      writeUint16(0),
      writeUint16(0),
      writeUint32(crc),
      writeUint32(size),
      writeUint32(size),
      writeUint16(nameBytes.length),
      writeUint16(0),
      nameBytes,
      data
    ];

    const localBuffer = localHeader.reduce((acc, part) => {
      if (part instanceof Uint8Array) {
        acc.push(part);
      } else {
        acc.push(textEncoder.encode(part));
      }
      return acc;
    }, []);

    const localSize = localBuffer.reduce((sum, part) => sum + part.length, 0);
    fileParts.push(...localBuffer);

    const centralHeader = [
      textEncoder.encode('PK\u0001\u0002'),
      writeUint16(0x14),
      writeUint16(0x14),
      writeUint16(0),
      writeUint16(0),
      writeUint16(0),
      writeUint16(0),
      writeUint32(crc),
      writeUint32(size),
      writeUint32(size),
      writeUint16(nameBytes.length),
      writeUint16(0),
      writeUint16(0),
      writeUint16(0),
      writeUint16(0),
      writeUint32(0),
      writeUint32(offset),
      nameBytes
    ];

    const centralBuffer = centralHeader.reduce((acc, part) => {
      if (part instanceof Uint8Array) {
        acc.push(part);
      } else {
        acc.push(textEncoder.encode(part));
      }
      return acc;
    }, []);

    const centralSize = centralBuffer.reduce((sum, part) => sum + part.length, 0);
    centralParts.push(...centralBuffer);

    offset += localSize;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);

  const endRecord = [
    textEncoder.encode('PK\u0005\u0006'),
    writeUint16(0),
    writeUint16(0),
    writeUint16(entries.length),
    writeUint16(entries.length),
    writeUint32(centralSize),
    writeUint32(fileParts.reduce((sum, part) => sum + part.length, 0)),
    writeUint16(0)
  ];

  const buffers = [...fileParts, ...centralParts, ...endRecord];
  const totalSize = buffers.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalSize);
  let position = 0;
  buffers.forEach((part) => {
    output.set(part, position);
    position += part.length;
  });
  return output;
};

const buildWorksheet = (rows) => {
  const cells = rows
    .map((row, rowIndex) => {
      const cellsForRow = row
        .map((value, colIndex) => {
          const cellRef = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
          return `<c r="${cellRef}" t="inlineStr"><is><t>${String(value ?? '')}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowIndex + 1}">${cellsForRow}</row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${cells}</sheetData></worksheet>`;
};

const buildWorkbook = () =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Estimate" sheetId="1" r:id="rId1"/></sheets></workbook>';

const buildContentTypes = () =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';

const buildRels = () =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';

const buildWorkbookRels = () =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>';

const buildCore = () =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:title>Concrete Estimate</dc:title><dc:creator>CostFlowAI</dc:creator><cp:lastModifiedBy>CostFlowAI</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">2024-01-01T00:00:00Z</dcterms:created></cp:coreProperties>';

const buildApp = () =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>CostFlowAI</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>Estimate</vt:lpstr></vt:vector></TitlesOfParts><Company>CostFlowAI</Company></Properties>';

export const utils = {
  book_new: () => ({ sheets: [], SheetNames: [] }),
  book_append_sheet: (wb, sheet, name) => {
    wb.sheets.push({ name, sheet });
    wb.SheetNames.push(name);
  },
  aoa_to_sheet: (rows) => ({ rows })
};

export const write = (workbook, options = {}) => {
  const rows = workbook.sheets[0]?.sheet.rows ?? [];
  const worksheet = buildWorksheet(rows);
  const files = [
    { name: '[Content_Types].xml', data: buildContentTypes() },
    { name: '_rels/.rels', data: buildRels() },
    { name: 'xl/workbook.xml', data: buildWorkbook() },
    { name: 'xl/_rels/workbook.xml.rels', data: buildWorkbookRels() },
    { name: 'xl/worksheets/sheet1.xml', data: worksheet },
    { name: 'docProps/core.xml', data: buildCore() },
    { name: 'docProps/app.xml', data: buildApp() }
  ];
  const zip = createZip(files);
  if (options.type === 'array') {
    return zip;
  }
  if (options.type === 'binary') {
    return Array.from(zip).map((byte) => String.fromCharCode(byte)).join('');
  }
  return zip;
};

export default {
  utils,
  write
};
