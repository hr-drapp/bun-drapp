import {
  abrcp_pana,
  abrp_pana,
  AnkCategory,
  JodiType,
  pana,
  PanaType,
  setp_pana,
  fl_jodi,
  sl_jodi,
  dl_jodi,
  sp_motor,
  cjck_jodi,
  crossing_jodi,
} from "./anks";

export function parseMixBetText(text: string, groupType?: string) {
  const textList = text.split("\n");
  const updatedTextList = [];

  const single_jodi_pana = {
    single: [] as any[],
    jodi: [] as any[],
    pana: [] as any[],
  };

  for (let betText of textList) {
    if (!betText) continue;

    /** PANA */
    if (isDPMOTOR(betText)) {
      updatedTextList.push("DP MOTOR - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "DP_MOTOR" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isSPMOTOR(betText)) {
      // console.log("Beat Text", betText);
      updatedTextList.push("SP MOTOR - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "SP_MOTOR" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isSETP(betText)) {
      console.log("Beat", betText);
      updatedTextList.push("SETP - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "SETP" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isABRCP(betText)) {
      const sepratorIndex = betText.split(/[=\s]+/);
      const amount = Number(sepratorIndex[1]);
      updatedTextList.push("ABRCP - " + betText);
      const numbers = abrcp_pana as number[];
      const total_amount = amount * numbers.length;
      single_jodi_pana.pana.push({
        amount: amount,
        numbers: abrcp_pana as any,
        numbers_map: abrcp_pana.reduce((a: any, number) => {
          a[number] = amount;
          return a;
        }, {}),
        total_amount: total_amount,
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isABRP(betText)) {
      const sepratorIndex = betText.split(/[=\s]+/);
      const amount = Number(sepratorIndex[1]); // ✅ number me convert
      console.log("ABRP AMOUNT", amount);

      updatedTextList.push("ABRP - " + betText);

      const numbers = abrp_pana as number[];
      const total_amount = amount * numbers.length; // ✅ total calculate

      single_jodi_pana.pana.push({
        amount: amount,
        numbers,
        numbers_map: numbers.reduce((a: any, number) => {
          a[number] = amount;
          return a;
        }, {}),
        total_amount: total_amount,
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isCp(betText)) {
      updatedTextList.push("CYCLE PANA - " + betText);
      // console.log("BeatTest", betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "CP" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isJdpcp(betText)) {
      updatedTextList.push("JDCP - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "JDCP" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isCsp(betText)) {
      updatedTextList.push("COMMON SP PANA - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "CSP" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isCdp(betText)) {
      updatedTextList.push("COMMON DP PANA - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "CDP" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isJdp(betText)) {
      updatedTextList.push("JDP - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "JDP" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isTp(betText)) {
      updatedTextList.push("TP - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "TP" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isDp(betText)) {
      updatedTextList.push("DP - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "DP" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isSp(betText)) {
      updatedTextList.push("SP - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(betText, { type: "SP" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isLadi(betText)) {
      /** JODI */
      updatedTextList.push("LADI JODI - " + betText);
      single_jodi_pana.jodi.push({
        ...parseJodiBetText(betText, { type: "LADI" }),
        category: AnkCategory.JODI,
        text: betText,
      });
    } else if (isCROSSING(betText)) {
      /** JODI */
      updatedTextList.push("CROSSING JODI - " + betText);
      single_jodi_pana.jodi.push({
        ...parseJodiBetText(betText, { type: "CROS" }),
        category: AnkCategory.JODI,
        text: betText,
      });
    } else if (isCJCK(betText)) {
      /** JODI */
      updatedTextList.push("CROSSING JODI DOUBLE HATA KE - " + betText);
      single_jodi_pana.jodi.push({
        ...parseJodiBetText(betText, { type: "CJCK" }),
        category: AnkCategory.JODI,
        text: betText,
      });
    } else if (isTotal(betText)) {
      const cleanText = betText.replace(/([=\-\s]*\d+)\s+\w+$/, "$1");
      updatedTextList.push("TOTAL - " + betText);
      single_jodi_pana.jodi.push({
        ...parseBetText(cleanText),
        category: AnkCategory.TOTAL,
        text: betText,
      });
    } else if (isBahar(betText)) {
      const cleanText = betText.replace(/([=\-\s]*\d+)\s+\w+$/, "$1");
      updatedTextList.push("BAHAR - " + betText);
      single_jodi_pana.jodi.push({
        ...parseBetText(cleanText),
        category: AnkCategory.BAHAR,
        text: betText,
      });
    } else if (isAndar(betText)) {
      const cleanText = betText.replace(/([=\-\s]*\d+)\s+\w+$/, "$1");
      updatedTextList.push("ANDAR - " + betText);
      single_jodi_pana.jodi.push({
        ...parseBetText(cleanText),
        category: AnkCategory.ANDAR,
        text: betText,
      });
    } else if (isFL(betText)) {
      const sepratorIndex = betText.split(/[=\s]+/);
      const amount = Number(sepratorIndex[1]); // ✅ number me convert
      console.log("fl AMOUNT", amount);

      updatedTextList.push("FULL LAL JODI - " + betText);

      const numbers = fl_jodi as number[];
      const total_amount = amount * numbers.length; // ✅ total calculate

      single_jodi_pana.jodi.push({
        amount: amount,
        numbers,
        numbers_map: numbers.reduce((a: any, number) => {
          a[number] = amount;
          return a;
        }, {}),
        total_amount: total_amount,
        category: AnkCategory.JODI,
        text: betText,
      });
    } else if (isSL(betText)) {
      const sepratorIndex = betText.split(/[=\s]+/);
      const amount = Number(sepratorIndex[1]); // ✅ number me convert
      console.log("SL AMOUNT", amount);

      updatedTextList.push("SINGLE LAL JODI - " + betText);

      const numbers = sl_jodi as number[];
      const total_amount = amount * numbers.length; // ✅ total calculate

      single_jodi_pana.jodi.push({
        amount: amount,
        numbers,
        numbers_map: numbers.reduce((a: any, number) => {
          a[number] = amount;
          return a;
        }, {}),
        total_amount: total_amount,
        category: AnkCategory.JODI,
        text: betText,
      });
    } else if (isPana(betText)) {
      const cleanText = betText.replace(/([=\-\s]*\d+)\s+\w+$/, "$1");
      // console.log("CLeanText", cleanText);
      updatedTextList.push("PANA - " + betText);
      single_jodi_pana.pana.push({
        ...parsePanaBetText(cleanText, { type: "MULTI" }),
        category: AnkCategory.PANA,
        text: betText,
      });
    } else if (isDL(betText)) {
      const sepratorIndex = betText.split(/[=\s]+/);
      const amount = Number(sepratorIndex[1]); // ✅ number me convert
      console.log("DL AMOUNT", amount);

      updatedTextList.push("DOUBLE LAL JODI - " + betText);

      const numbers = dl_jodi as number[];
      const total_amount = amount * numbers.length; // ✅ total calculate

      single_jodi_pana.jodi.push({
        amount: amount,
        numbers,
        numbers_map: numbers.reduce((a: any, number) => {
          a[number] = amount;
          return a;
        }, {}),
        total_amount: total_amount,
        category: AnkCategory.JODI,
        text: betText,
      });
    } else if (isJodi(betText)) {
      updatedTextList.push("JODI - " + betText);
      single_jodi_pana.jodi.push({
        ...parseJodiBetText(betText, { type: "JODI" }),
        category: AnkCategory.JODI,
        text: betText,
      });
    } else if (isSingle(betText)) {
      /** SINGLE */
      // console.log("SIngle BetText", betText);
      updatedTextList.push("SINGLE - " + betText);
      single_jodi_pana.single.push({
        ...parseBetText(betText),
        category: AnkCategory.SINGLE,
        text: betText,
      });
    } else {
      updatedTextList.push(betText);
    }
  }

  // console.log(updatedTextList.join("\n"))

  return { single_jodi_pana: single_jodi_pana, result_text: updatedTextList };
}

export const isSingle = (text: string) =>
  /^(?:SINGLE|Single|single|SIngle|sinGLE|Ank|ank|AnK|aNk|anK|ANK)?(?:[\s]*[\.\,\+\=\-\?\*\!\@\#\$'|\(\);"\\:%\^&_\/£><÷×}{~`\%]*\d)*(?:[\.\,\=\-\?\*\!\@\#\$'|\(\);"\\:%\^&_\/£><÷×}{~`\%]*=?\d+)*$/.test(
    text.trim()
  );

//                                 /^(\d[\.\,\=\-\?\*\@\#\$\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%]?)+\d=(\d+)$/
export const isJodi = (text: string) =>
  /^(?:JODI|jodi|J|j|Jodi|joDI)?[\s]*\d{2}(?:[\.\,\=\-\?\*\!\@\#\$'|\(\);\+"\\:%\^&_\/£><÷×}{~`\%\s]*\d{2})*(?:[\s\.\,\=\-\?\*\!\@\#\$'|\(\);\+"\\:%\^&_\/£><÷×}{~`\%\s]*\(?[a-zA-Z]*\d+\)?)?$/.test(
    text.trim()
  );

export const isPana = (text: string) =>
  /^(\d{3}[\.\,\=\-\?\*\!\@\#\$'|\(\);\+"\\:%\^&_\/£><÷×}{~\%\s]*)*\d{3}[\.\,\=\-\?\*\!\@\#\$'|\(\);\+"\\:%\^&_\/£><÷×}{~\%\s]\d+(?:\s\w+)?$/.test(
    text
  );

export const isAndar = (text: string) =>
  /^(andar|Andar|a|A)[\+\*\^\$\#\@\!\-\s,\.\/]*([\d\.\,\=\-\?\*\!\@\#\$'|\(\);\+"\\:%\^&_\/£><÷×}{~`\%\s]*\d+|(?:=+\d+)+)+$/.test(
    text.replace(/\n/g, " ")
  );
export const isBahar = (text: string) =>
  /^(bahar|Bahar|b|B)[\+\*\^\$\#\@\!\-\s,\.\/]*([\d\.\,\=\-\?\*\!\@\#\$'|\(\);\+"\\:%\^&_\/£><÷×}{~`\%\s]*\d+|(?:=+\d+)+)+$/.test(
    text.replace(/\n/g, " ")
  );

export const isTotal = (text: string) =>
  /^(total|Total|t|T)[\+\*\^\$\#\@\!\-\s,\.\/]*([\d\.\,\=\-\?\*\!\@\#\$'|\(\);\+"\\:%\^&_\/£><÷×}{~`\%\s]*\d+|(?:=+\d+)+)+$/.test(
    text.replace(/\n/g, " ")
  );

export const isLadi = (text: string) =>
  /^(ladi|Ladi|l|L|LJ|Lj|LADI JODI|Ladi Jodi|Ladi jodi|lJ)[\-\s]?(\d[\.\,\=\-\?\*\!\@\#\$\'\|\(\)\;\+\"\:\\\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]?)*\d[\=\-\?\*\!\@\#\$\'\|\(\)\;\+\"\:\\\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+$/.test(
    text
  );

export const isSp = (text: string) =>
  /^(SP|Sp|sP|sp)[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+(?:[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+)*$/.test(
    text
  );

export const isDp = (text: string) =>
  /^(DP|Dp|dP|dp)[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+(?:[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+)*$/.test(
    text
  );

export const isTp = (text: string) =>
  /^(TP|Tp|tP|tp)[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+(?:[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+)*$/.test(
    text
  );

export const isJdp = (text: string) =>
  /^(JDP|jdp|Jdp|jDP|Jd P|Jd p|jd p |jodi pana|JODI PANA|jodipana|JODIPANA)[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+(?:[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+)*$/.test(
    text
  );

export const isCsp = (text: string) =>
  /^(CSP|csp|Csp|cSP|Cs P|cS p|cs p|cmn sp|Cmn Sp|CMN SP|Cmn sP|CmN SP|Common sp|common sp|COMMON SP|Common Sp|Comman Sp|comman sp|COMMAN SP|CMN sp|CMN sP|Cmn sp)[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+(?:[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+)*$/.test(
    text
  );

export const isCdp = (text: string) =>
  /^(CDP|cdp|Cdp|cDP|Cd P|cD p|cd p|Cmn dp|Cmn Dp|CMN DP|cmn dp|CmN dP|Common dp|common dp|COMMON DP|Common Dp|Comman Dp|comman dp|COMMAN DP|CMN dp|CMN dP)[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+(?:[\s!@#$%^&*_=+|\\:;'",.<>/?()[\]{}-]*\d+)*$/.test(
    text
  );

export const isJdpcp = (text: string) =>
  /^(JDCP|jdcp|Jdcp|jDCP|Jdpcp|jdpCP|Jdc\s?p|jdc\s?p|jodi cut pana )[\-\*\+\#\=\$\s,\.\/]*\d+(?:[\.\,\=\-\?\*\!\@\#\$\'\|\\\(\)\;\+\"\:\\\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+)+$/i.test(
    text
  );

export const isCp = (text: string) =>
  /^(CP|cp|cP|Cp|Cycle Pana|cycle pana|cyclePana|CyclePana|sr|SR|sR|Sr|Series|series|Cycle)(?:[\-\+\*\#\@\=\$\s,\.\/]*\d+)(?:[\.\,\=\-\+\?\*\!\@\#\$'|\(\);\+"\\:%\^&_\/£><÷×}{~\%\s]+\d+)+(?:[=_]\d+)?$/i.test(
    text
  );

export const isABRP = (text: string) =>
  /^(ABRP|abrp|ABR|abr|Abrp|Abr|Abr P|Abr p|Abr P)[\-\s]*\d+(?:[\=\-\?\*\!\@\#\$\'\|\(\)\;\+\:\\\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+)*$/.test(
    text
  );

export const isFL = (text: string) =>
  /^(fl|full lal jodi|Full lal jodi|Fl|FL|fL)[\-\s]*\d+(?:[\=\-\?\*\!\@\#\$\'\|\(\)\;\+\:\\\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+)*$/.test(
    text
  );

export const isSL = (text: string) =>
  /^(SL|sl|Sl|sL|s l|S L)[\-\s]*\d+(?:[\=\-\?\*\!\@\#\$\'\|\(\)\;\+\:\\\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+)*$/.test(
    text
  );
export const isDL = (text: string) =>
  /^(DL|dl|Dl|dL|d l|D L)[\-\s]*\d+(?:[\=\-\?\*\!\@\#\$\'\|\(\)\;\+\:\\\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+)*$/.test(
    text
  );

export const isABRCP = (text: string) =>
  /^(ABRCP|abrcp|Abrcp|Abrc p|Abrc P)[\-\*\+\#\=\$\s,\.\/]+\d+(?:[\=\-\?\*\!\@\#\$\'\|\"\:\+\(\)\;\\\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+)*$/i.test(
    text
  );

export const isSETP = (text: string) =>
  /^(SET|set|SETP|setp|Set|Setp|SetP|set p|Set P|Set p|Family|family|F|f|fAmily|faMILy)[\-\*\+\#\=\&\$\s,\.\/]*\d(?:[\.\,\=\-\?\*\!\@\#\$\'\|\:\"\(\)\;\+\\\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d)*$/.test(
    text
  );
export const isCROSSING = (text: string) =>
  /^(CR|cr|Cr|cR|CJ|Cj|cj|cJ|crossig|CROSSING|Crossing|CRossingJodi|crossingjodi|CrossingJodi)[\-\s]?(\d[\.\,\(\)\!\'\|\+\"\:\;\=\-\\\?\*\@\#\$\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]?)*\d[\.\,\/\|\(\)\!\'\=\-\\\?\*\@\#\$\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+$/.test(
    text
  );

export const isCJCK = (text: string) =>
  /^(CJDHK|cjdhk|CjDhk|cjDHK|Cjdhk|cJDhk|CJdhK|CDH|cdh|Cdh|cDH|crossing jodi double hata ke|Crossing jodi double hata ke)[\-\s]?(\d[\.\,\(\)\!\'\|\+\"\:\;\=\-\\\?\*\@\#\$\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]?)*\d[\.\,\/\|\(\)\!\'\=\-\\\?\*\@\#\$\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+$/.test(
    text
  );

export const isSPMOTOR = (text: string) =>
  /^(SP|sp|Sp|sP)[\-\s]?(MOTOR|motor|MOTAR|motar|MOTER|moter|Moter|Motar)[\-\s]?(\d[\.\,\(\)\!\'\|\+\"\:\;\=\-\\\?\*\@\#\$\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]?)*\d[\.\,\/\|\(\)\!\'\=\-\\\?\*\@\#\$\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+$/.test(
    text
  );
export const isDPMOTOR = (text: string) =>
  /^(DP|dp|Dp|dP)[\-\s]?(MOTOR|motor|MOTAR|motar|MOTER|moter|Moter|Motar)[\-\s]?(\d[\.\,\(\)\!\'\|\+\"\:\;\=\-\\\?\*\@\#\$\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]?)*\d[\.\,\/\|\(\)\!\'\=\-\\\?\*\@\#\$\%\^\&\_\/\£\>\<\÷\×\}\{\~\`\%\s]*\d+$/.test(
    text
  );

export const isNumber = (str: string) => /^\d+$/.test(str);

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: {}; amount: any; }}
 */
export function parseBetText(betText: string) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();

  // if (category === "3") {

  //   if (!options?.type) {
  //     return parsePanaBetText(betText, options);

  //   }

  //   if (options?.type == "SP") {
  //     return parseSPBetText(betText, options)
  //   }

  // }

  /** amount to be return */
  let amount = 0;

  /** check whether the text has rs if it's then extract the amount */
  let rsIndex = betText.indexOf("rs");
  // console.log("🚀 ~ parseBetText ~ rsIndex:", rsIndex)
  if (rsIndex >= 0) {
    /** temp amount to store the number after "rs" */
    let tempAmount = "";

    /** iterate over the text after "rs" */
    for (let i = rsIndex + 2; i <= betText.length; i++) {
      /** get current character */
      let char = betText[i];
      // console.log("🚀 ~ parseBetText ~ char:", char)

      /** check if character is number or not */
      const isNum = isNumber(char);

      /** it it's number then append into stored number, else break the loop */
      if (isNum) {
        tempAmount = tempAmount + char;
      } else {
        break;
      }
    }

    /** if tempAmount has a store then assign it to the amount, and remove the amount part from the text */
    if (tempAmount) {
      amount = parseInt(tempAmount);
      betText = betText.slice(0, rsIndex);
    }
  }
  /** check whether the text has rs if it's then extract the amount (END) */

  /** create a empty number list to be used later */
  const numMap = {} as Record<any, any>;
  /** create a empty number list to be used later */
  const numList = [];
  /** temp number to store number with limit of 2 length */
  let tempNumber = "";

  /** to store pair of index of each no-numeric character for future use */
  let tempCharIndexHolder = [[]];

  /** iterate over the text to extract numbers */
  for (let i = 0; i <= betText.length; i++) {
    /** get currect character */
    let char = betText[i];

    /** check whether the character is number or not */
    const isNum = isNumber(char);

    /** TASK 1 - if it's not number then store the index */
    if (!isNum) {
      let lastTempCharIndexHolder = tempCharIndexHolder.at(0) as any;

      if (lastTempCharIndexHolder?.length) {
        if (lastTempCharIndexHolder.length >= 2) {
          tempCharIndexHolder.unshift([i] as any);
        } else {
          lastTempCharIndexHolder.push(i);
        }
      } else {
        lastTempCharIndexHolder?.push(i);
      }
    }

    let remainingText = betText.substring(i);
    if (isNumber(remainingText)) {
      amount = parseInt(remainingText);
      break;
    }

    if (tempNumber.length > 0) {
      let parsedTempNumber = parseInt(tempNumber);

      if (parsedTempNumber >= 0 && parsedTempNumber <= 9) {
        numList.push(tempNumber);
        numMap[tempNumber] = 0;
        tempNumber = "";
      }
    }

    if (isNum) {
      tempNumber = tempNumber + char;
    } else {
      if (tempNumber) {
        numList.push(tempNumber);
        numMap[tempNumber] = 0;
      }
      tempNumber = "";
    }
  }
  const result = {
    numbers: numList,
    amount: amount || numList.at(-1),
    numbers_map: {},
    total_amount: 0,
  };

  if (!amount) {
    for (let a of tempCharIndexHolder) {
      if (a.length > 1) {
        let b = betText.substring(a[0] + 1, a[1]);

        if (isNumber(b)) {
          result.amount = b;
          break;
        }
      }
    }
  }

  result.numbers_map = numList.reduce((a: any, b) => {
    a[b] = result.amount;
    return a;
  }, {});

  result.total_amount = (result.amount as any) * result.numbers.length;

  return result;
}

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: {}; amount: any; }}
 */
export function parsePanaCpBetText(
  betText: string,
  category: "1" | "3",
  options?: {
    type: "SP" | "DP" | "CP" | "";
  }
) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();

  // if (category === "3") {

  //   if (!options?.type) {
  //     return parsePanaBetText(betText, options);

  //   }

  //   if (options?.type == "SP") {
  //     return parseSPBetText(betText, options)
  //   }

  // }

  /** amount to be return */
  let amount = 0;

  /** check whether the text has rs if it's then extract the amount */
  let rsIndex = betText.indexOf("rs");
  console.log("🚀 ~ parseBetText ~ rsIndex:", rsIndex);
  if (rsIndex >= 0) {
    /** temp amount to store the number after "rs" */
    let tempAmount = "";

    /** iterate over the text after "rs" */
    for (let i = rsIndex + 2; i <= betText.length; i++) {
      /** get current character */
      let char = betText[i];
      console.log("🚀 ~ parseBetText ~ char:", char);

      /** check if character is number or not */
      const isNum = isNumber(char);

      /** it it's number then append into stored number, else break the loop */
      if (isNum) {
        tempAmount = tempAmount + char;
      } else {
        break;
      }
    }

    /** if tempAmount has a store then assign it to the amount, and remove the amount part from the text */
    if (tempAmount) {
      amount = parseInt(tempAmount);
      betText = betText.slice(0, rsIndex);
    }
  }
  /** check whether the text has rs if it's then extract the amount (END) */

  /** create a empty number list to be used later */
  const numMap = {} as Record<any, any>;
  /** create a empty number list to be used later */
  const numList = [];
  /** temp number to store number with limit of 2 length */
  let tempNumber = "";

  /** to store pair of index of each no-numeric character for future use */
  let tempCharIndexHolder = [[]];

  /** iterate over the text to extract numbers */
  for (let i = 0; i <= betText.length; i++) {
    /** get currect character */
    let char = betText[i];

    /** check whether the character is number or not */
    const isNum = isNumber(char);

    /** TASK 1 - if it's not number then store the index */
    if (!isNum) {
      let lastTempCharIndexHolder = tempCharIndexHolder.at(0) as any;

      if (lastTempCharIndexHolder?.length) {
        if (lastTempCharIndexHolder.length >= 2) {
          tempCharIndexHolder.unshift([i] as any);
        } else {
          lastTempCharIndexHolder.push(i);
        }
      } else {
        lastTempCharIndexHolder?.push(i);
      }
    }

    let remainingText = betText.substring(i);
    if (isNumber(remainingText)) {
      amount = parseInt(remainingText);
      break;
    }

    if (tempNumber.length > 0) {
      let parsedTempNumber = parseInt(tempNumber);

      if (parsedTempNumber >= 10 && parsedTempNumber <= 99) {
        numList.push(tempNumber);
        numMap[tempNumber] = 0;
        tempNumber = "";
      }
    }

    if (isNum) {
      tempNumber = tempNumber + char;
    } else {
      if (tempNumber) {
        numList.push(tempNumber);
        numMap[tempNumber] = 0;
      }
      tempNumber = "";
    }
  }
  const result = {
    numbers: numList,
    amount: amount || numList.at(-1),
    numbers_map: {},
    total_amount: 0,
  };

  if (!amount) {
    for (let a of tempCharIndexHolder) {
      if (a.length > 1) {
        let b = betText.substring(a[0] + 1, a[1]);

        if (isNumber(b)) {
          result.amount = b;
          break;
        }
      }
    }
  }

  result.numbers_map = numList.reduce((a: any, b) => {
    a[b] = result.amount;
    return a;
  }, {});

  result.total_amount = (result.amount as any) * result.numbers.length;

  return result;
}

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: {}; amount: any; }}
 */
export function parsePanaBetText(
  betText: string,
  options?: {
    type: PanaType;
    khadiLine?: boolean;
  }
) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();
  console.log("Divide Usestate is getting called.🚀 ~ betText:", betText);

  const result = {
    numbers: [] as Array<number>,
    amount: 0,
    numbers_map: {},
    total_amount: 0,
  };

  if (options?.type == "MULTI") {
    if (options.khadiLine) {
      return parsePanaBetTextKhadiLine(betText);
    } else {
      // console.log("Divide Usestate is getting called. into the code stack")
      /** amount to be return */
      let amount = 0;

      /** check whether the text has rs if it's then extract the amount */
      let rsIndex = betText.indexOf("rs");
      // // console.log("🚀 ~ parseBetText ~ rsIndex:", rsIndex)
      if (rsIndex >= 0) {
        /** temp amount to store the number after "rs" */
        let tempAmount = "";

        /** iterate over the text after "rs" */
        for (let i = rsIndex + 2; i <= betText.length; i++) {
          /** get current character */
          let char = betText[i];
          // // console.log("🚀 ~ parseBetText ~ char:", char)

          /** check if character is number or not */
          const isNum = isNumber(char);

          /** it it's number then append into stored number, else break the loop */
          if (isNum) {
            tempAmount = tempAmount + char;
          } else {
            break;
          }
        }

        /** if tempAmount has a store then assign it to the amount, and remove the amount part from the text */
        if (tempAmount) {
          amount = parseInt(tempAmount);
          betText = betText.slice(0, rsIndex);
        }
      }
      /** check whether the text has rs if it's then extract the amount (END) */

      /** create a empty number list to be used later */
      const numMap = {} as Record<any, any>;
      /** create a empty number list to be used later */
      const numList = [] as Array<any>;
      /** temp number to store number with limit of 2 length */
      let tempNumber = "";

      /** to store pair of index of each no-numeric character for future use */
      let tempCharIndexHolder = [[]];

      // console.log(`Divide Usestate is getting called. iterate over the text ${betText.length}: `, amount)
      /** iterate over the text to extract numbers */
      for (let i = 0; i <= betText.length; i++) {
        /** get currect character */
        let char = betText[i];
        // console.log("Divide Usestate is getting called.: ", char)
        /** check whether the character is number or not */
        const isNum = isNumber(char);

        /** TASK 1 - if it's not number then store the index */
        if (!isNum) {
          let lastTempCharIndexHolder = tempCharIndexHolder.at(0) as any;

          if (lastTempCharIndexHolder?.length) {
            if (lastTempCharIndexHolder.length >= 2) {
              tempCharIndexHolder.unshift([i] as any);
            } else {
              lastTempCharIndexHolder.push(i);
            }
          } else {
            lastTempCharIndexHolder?.push(i);
          }
        }

        let remainingText = betText.substring(i);
        if (isNumber(remainingText)) {
          amount = parseInt(remainingText);
          break;
        }

        if (tempNumber.length > 0) {
          let parsedTempNumber = parseInt(tempNumber);

          if (parsedTempNumber >= 100 && parsedTempNumber <= 999) {
            numList.push(tempNumber);
            numMap[tempNumber] = 0;
            tempNumber = "";
          }
        }

        if (isNum) {
          tempNumber = tempNumber + char;
        } else {
          if (tempNumber) {
            numList.push(tempNumber);
            numMap[tempNumber] = 0;
          }
          tempNumber = "";
        }
      }
      const result = {
        numbers: numList,
        amount: amount || numList.at(-1),
        numbers_map: {},
        total_amount: 0,
      };

      if (!amount) {
        for (let a of tempCharIndexHolder) {
          if (a.length > 1) {
            let b = betText.substring(a[0] + 1, a[1]);

            if (isNumber(b)) {
              result.amount = b;
              break;
            }
          }
        }
      }

      result.numbers_map = numList.reduce((a: any, b) => {
        a[b] = result.amount;
        return a;
      }, {});

      result.total_amount = (result.amount as any) * result.numbers.length;

      // console.log("Divide Usestate is getting called. : ", result)

      return result;
    }
  } else if (options?.type == "SP_MOTOR") {
    if (options.khadiLine) {
      const _result = parsePanaSPMotorBetTextKhadiLine(betText);
      // console.log("🚀 ~ _result:", _result)

      const result = {
        numbers: [] as Array<number>,
        amount: 0,
        numbers_map: {},
        total_amount: 0,
      };

      // console.log(_result);

      for (let nums of _result.numbers) {
        let numbers = generatePanaSPMotorNumbers(nums) as any;
        // console.log("🚀 ~ numbers:", numbers)

        const amount = parseFloat(_result.numbers_map[nums]);
        // console.log("🚀 ~ amount:", amount)

        for (let n of numbers) {
          result.numbers.push(n);
          (result.numbers_map as any)[n] = amount;
          result.amount = result.amount + amount;
          result.total_amount = result.total_amount + amount;
        }
      }

      return result;
    }

    /** amount to be return */
    let amount = 0;

    /** check whether the text has rs if it's then extract the amount */
    let rsIndex = betText.indexOf("rs");
    // // console.log("🚀 ~ parseBetText ~ rsIndex:", rsIndex)
    if (rsIndex >= 0) {
      /** temp amount to store the number after "rs" */
      let tempAmount = "";

      /** iterate over the text after "rs" */
      for (let i = rsIndex + 2; i <= betText.length; i++) {
        /** get current character */
        let char = betText[i];
        // // console.log("🚀 ~ parseBetText ~ char:", char)

        /** check if character is number or not */
        const isNum = isNumber(char);

        /** it it's number then append into stored number, else break the loop */
        if (isNum) {
          tempAmount = tempAmount + char;
        } else {
          break;
        }
      }

      /** if tempAmount has a store then assign it to the amount, and remove the amount part from the text */
      if (tempAmount) {
        amount = parseInt(tempAmount);
        betText = betText.slice(0, rsIndex);
      }
    }
    /** check whether the text has rs if it's then extract the amount (END) */

    /** create a empty number list to be used later */
    const numMap = {} as Record<any, any>;
    /** create a empty number list to be used later */
    const numList = [] as Array<any>;
    /** temp number to store number with limit of 2 length */
    let tempNumber = "";

    /** to store pair of index of each no-numeric character for future use */
    let tempCharIndexHolder = [[]];

    /** iterate over the text to extract numbers */
    for (let i = 0; i <= betText.length; i++) {
      /** get currect character */
      let char = betText[i];

      /** check whether the character is number or not */
      const isNum = isNumber(char);

      /** TASK 1 - if it's not number then store the index */
      if (!isNum) {
        let lastTempCharIndexHolder = tempCharIndexHolder.at(0) as any;

        if (lastTempCharIndexHolder?.length) {
          if (lastTempCharIndexHolder.length >= 2) {
            tempCharIndexHolder.unshift([i] as any);
          } else {
            lastTempCharIndexHolder.push(i);
          }
        } else {
          lastTempCharIndexHolder?.push(i);
        }
      }

      let remainingText = betText.substring(i);
      if (isNumber(remainingText)) {
        amount = parseInt(remainingText);
        break;
      }

      if (tempNumber.length > 0) {
        let parsedTempNumber = parseInt(tempNumber);

        // if (parsedTempNumber > 999) {

        //   numList.push(tempNumber)
        //   numMap[tempNumber] = 0;
        //   tempNumber = ""
        // }
      }

      if (isNum) {
        tempNumber = tempNumber + char;
      } else {
        if (tempNumber) {
          numList.push(tempNumber);
          numMap[tempNumber] = 0;
        }
        tempNumber = "";
      }
    }
    const result = {
      numbers: numList,
      amount: amount || numList.at(-1),
      numbers_map: {},
      total_amount: 0,
    };

    if (!amount) {
      for (let a of tempCharIndexHolder) {
        if (a.length > 1) {
          let b = betText.substring(a[0] + 1, a[1]);

          if (isNumber(b)) {
            result.amount = b;
            break;
          }
        }
      }
    }

    result.numbers_map = numList.reduce((a: any, b) => {
      a[b] = result.amount;
      return a;
    }, {});

    // result.total_amount = (result.amount as any) * result.numbers.length
    let numbers = [...result.numbers];
    console.log("🚀 ~ numbers:", numbers);
    result.numbers = [];
    for (let nums of numbers) {
      result.numbers = [...result.numbers, ...generatePanaSPMotorNumbers(nums)];
    }

    for (let n of result.numbers) {
      (result.numbers_map as any)[n] = result.amount;
      result.total_amount = result.total_amount + result.amount;
    }
    console.log("SP MOTOR NUMBERS: ", result);

    return result;
  } else if (options?.type == "DP_MOTOR") {
    if (options.khadiLine) {
      const _result = parsePanaSPMotorBetTextKhadiLine(betText);
      // console.log("🚀 ~ _result:", _result)

      const result = {
        numbers: [] as Array<number>,
        amount: 0,
        numbers_map: {},
        total_amount: 0,
      };

      // console.log(_result);

      for (let nums of _result.numbers) {
        let numbers = generateDPMotorPana(nums) as any;
        // console.log("🚀 ~ numbers:", numbers)

        const amount = parseFloat(_result.numbers_map[nums]);
        // console.log("🚀 ~ amount:", amount)

        for (let n of numbers) {
          result.numbers.push(n);
          (result.numbers_map as any)[n] = amount;
          result.amount = result.amount + amount;
          result.total_amount = result.total_amount + amount;
        }
      }

      return result;
    }

    /** amount to be return */
    let amount = 0;

    /** check whether the text has rs if it's then extract the amount */
    let rsIndex = betText.indexOf("rs");
    // // console.log("🚀 ~ parseBetText ~ rsIndex:", rsIndex)
    if (rsIndex >= 0) {
      /** temp amount to store the number after "rs" */
      let tempAmount = "";

      /** iterate over the text after "rs" */
      for (let i = rsIndex + 2; i <= betText.length; i++) {
        /** get current character */
        let char = betText[i];
        // // console.log("🚀 ~ parseBetText ~ char:", char)

        /** check if character is number or not */
        const isNum = isNumber(char);

        /** it it's number then append into stored number, else break the loop */
        if (isNum) {
          tempAmount = tempAmount + char;
        } else {
          break;
        }
      }

      /** if tempAmount has a store then assign it to the amount, and remove the amount part from the text */
      if (tempAmount) {
        amount = parseInt(tempAmount);
        betText = betText.slice(0, rsIndex);
      }
    }
    /** check whether the text has rs if it's then extract the amount (END) */

    /** create a empty number list to be used later */
    const numMap = {} as Record<any, any>;
    /** create a empty number list to be used later */
    const numList = [] as Array<any>;
    /** temp number to store number with limit of 2 length */
    let tempNumber = "";

    /** to store pair of index of each no-numeric character for future use */
    let tempCharIndexHolder = [[]];

    /** iterate over the text to extract numbers */
    for (let i = 0; i <= betText.length; i++) {
      /** get currect character */
      let char = betText[i];

      /** check whether the character is number or not */
      const isNum = isNumber(char);

      /** TASK 1 - if it's not number then store the index */
      if (!isNum) {
        let lastTempCharIndexHolder = tempCharIndexHolder.at(0) as any;

        if (lastTempCharIndexHolder?.length) {
          if (lastTempCharIndexHolder.length >= 2) {
            tempCharIndexHolder.unshift([i] as any);
          } else {
            lastTempCharIndexHolder.push(i);
          }
        } else {
          lastTempCharIndexHolder?.push(i);
        }
      }

      let remainingText = betText.substring(i);
      if (isNumber(remainingText)) {
        amount = parseInt(remainingText);
        break;
      }

      if (tempNumber.length > 0) {
        let parsedTempNumber = parseInt(tempNumber);

        // if (parsedTempNumber > 999) {

        //   numList.push(tempNumber)
        //   numMap[tempNumber] = 0;
        //   tempNumber = ""
        // }
      }

      if (isNum) {
        tempNumber = tempNumber + char;
      } else {
        if (tempNumber) {
          numList.push(tempNumber);
          numMap[tempNumber] = 0;
        }
        tempNumber = "";
      }
    }
    const result = {
      numbers: numList,
      amount: amount || numList.at(-1),
      numbers_map: {},
      total_amount: 0,
    };

    if (!amount) {
      for (let a of tempCharIndexHolder) {
        if (a.length > 1) {
          let b = betText.substring(a[0] + 1, a[1]);

          if (isNumber(b)) {
            result.amount = b;
            break;
          }
        }
      }
    }

    result.numbers_map = numList.reduce((a: any, b) => {
      a[b] = result.amount;
      return a;
    }, {});

    // result.total_amount = (result.amount as any) * result.numbers.length

    // if (result.numbers.length == 1) {
    let numbers = [...result.numbers];
    // console.log("🚀 ~ numbers:", numbers)
    result.numbers = [];

    for (let nums of numbers) {
      // console.log("🚀 ~ generateDPMotorPana(nums):", generateDPMotorPana(nums))

      result.numbers = [...result.numbers, ...generateDPMotorPana(nums)];
    }

    for (let n of result.numbers) {
      (result.numbers_map as any)[n] = result.amount;
      result.total_amount = result.total_amount + result.amount;
    }
    // }

    return result;
  } else {
    // extract number from bet text
    const number = parseInt(betText.replace(/[^0-9]/g, ""));

    if (!Number.isNaN(number) && number >= 0 && number <= 9) {
      const numbers = pana.get(`${number}_${options?.type}`);
      console.log("🚀 ~ numbers:", numbers);

      if (numbers) {
        for (let n of numbers) {
          result.numbers.push(n);
          (result.numbers_map as any)[n] = 0;
        }
      }
    } else if (
      !Number.isNaN(number) &&
      number >= 10 &&
      number <= 99 &&
      options?.type == "CP"
    ) {
      const [numbersPart] = betText.split("="); // "21.22.23"
      const amountMatch = betText.match(/=(\d+)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      // Extract only numbers from numbersPart
      const numbersList = numbersPart.match(/\d{1,2}/g) || [];
      console.log("NumberList", numbersList);
      for (let numStr of numbersList) {
        const numKey = numStr.padStart(2, "0");
        const numbers = pana.get(`${numKey}_${options?.type}`);
        console.log("🚀 ~ numbers:", numbers);

        if (numbers) {
          for (let n of numbers) {
            result.numbers.push(n);
            (result.numbers_map as any)[n] = amount;
            result.total_amount += amount;
          }
        }
      }

      console.log("~~~~Result", result);
    } else if (options?.type == "CP") {
      console.log("~~~Result", parsePanaCpBetText(betText, "1"));
      const parts = betText
        .replace(/cp/gi, "")
        .trim()
        .split(/[=\-@#$%^&*()_]+/);
      const amount = parseFloat(parts.pop() || "0"); // last part = amount
      const numbersPart = parts.join(" "); // jo bache -> numbers

      // ✅ ab saare 1-2 digit numbers including 00 nikal lo
      const numbersList = numbersPart.match(/\d{1,2}/g) || [];

      for (let numStr of numbersList) {
        const numKey = numStr.padStart(2, "0"); // force "00"
        const panaNumbers = pana.get(`${numKey}_CP`);
        if (panaNumbers) {
          for (let n of panaNumbers) {
            result.numbers.push(n);
            (result.numbers_map as any)[n] = amount;
            result.amount = amount as any;
            result.total_amount += amount;
          }
        }
      }
    } else if (
      !Number.isNaN(number) &&
      number >= 100 &&
      number <= 999 &&
      options?.type === "SETP"
    ) {
      const numbers = setp_pana.find((f) => f.includes(parseInt(`${number}`)));

      // console.log("🚀 ~ numbers:", numbers)

      if (numbers) {
        for (let n of numbers) {
          const amount = parseFloat((result.numbers_map as any)[number]);
          // console.log(`🚀 ~ amount for ${n}:`, amount)
          result.numbers.push(n);

          (result.numbers_map as any)[n] = amount;

          result.amount = amount as any;
          result.total_amount = result.total_amount + amount;
        }
      }
    } else if (options?.type === "SETP") {
      if (options.khadiLine) {
        let _result = parsePanaBetTextKhadiLine(betText);

        for (let number of _result.numbers) {
          const numbers = setp_pana.find((f) => f.includes(parseInt(number)));

          // console.log("🚀 ~ numbers:", numbers)

          if (numbers) {
            for (let n of numbers) {
              const amount = parseFloat((_result.numbers_map as any)[number]);
              // console.log(`🚀 ~ amount for ${n}:`, amount)
              result.numbers.push(n);

              (result.numbers_map as any)[n] = amount;

              result.amount = amount as any;
              result.total_amount = result.total_amount + amount;
            }
          }
        }
      } else {
        /** amount to be return */
        let amount = 0;

        /** check whether the text has rs if it's then extract the amount */
        let rsIndex = betText.indexOf("rs");
        // // console.log("🚀 ~ parseBetText ~ rsIndex:", rsIndex)
        if (rsIndex >= 0) {
          /** temp amount to store the number after "rs" */
          let tempAmount = "";

          /** iterate over the text after "rs" */
          for (let i = rsIndex + 2; i <= betText.length; i++) {
            /** get current character */
            let char = betText[i];
            // // console.log("🚀 ~ parseBetText ~ char:", char)

            /** check if character is number or not */
            const isNum = isNumber(char);

            /** it it's number then append into stored number, else break the loop */
            if (isNum) {
              tempAmount = tempAmount + char;
            } else {
              break;
            }
          }

          /** if tempAmount has a store then assign it to the amount, and remove the amount part from the text */
          if (tempAmount) {
            amount = parseInt(tempAmount);
            betText = betText.slice(0, rsIndex);
          }
        }
        /** check whether the text has rs if it's then extract the amount (END) */

        /** create a empty number list to be used later */
        const numMap = {} as Record<any, any>;
        /** create a empty number list to be used later */
        const numList = [] as Array<any>;
        /** temp number to store number with limit of 2 length */
        let tempNumber = "";

        /** to store pair of index of each no-numeric character for future use */
        let tempCharIndexHolder = [[]];

        /** iterate over the text to extract numbers */
        for (let i = 0; i <= betText.length; i++) {
          /** get currect character */
          let char = betText[i];

          /** check whether the character is number or not */
          const isNum = isNumber(char);

          /** TASK 1 - if it's not number then store the index */
          if (!isNum) {
            let lastTempCharIndexHolder = tempCharIndexHolder.at(0) as any;

            if (lastTempCharIndexHolder?.length) {
              if (lastTempCharIndexHolder.length >= 2) {
                tempCharIndexHolder.unshift([i] as any);
              } else {
                lastTempCharIndexHolder.push(i);
              }
            } else {
              lastTempCharIndexHolder?.push(i);
            }
          }

          let remainingText = betText.substring(i);
          if (isNumber(remainingText)) {
            amount = parseInt(remainingText);
            break;
          }

          if (tempNumber.length > 0) {
            let parsedTempNumber = parseInt(tempNumber);

            if (parsedTempNumber >= 100 && parsedTempNumber <= 999) {
              numList.push(tempNumber);
              numMap[tempNumber] = 0;
              tempNumber = "";
            }
          }

          if (isNum) {
            tempNumber = tempNumber + char;
          } else {
            if (tempNumber) {
              numList.push(tempNumber);
              numMap[tempNumber] = 0;
            }
            tempNumber = "";
          }
        }
        const _result = {
          numbers: numList,
          amount: amount || numList.at(-1),
          numbers_map: {},
          total_amount: 0,
        };

        if (!amount) {
          for (let a of tempCharIndexHolder) {
            if (a.length > 1) {
              let b = betText.substring(a[0] + 1, a[1]);

              if (isNumber(b)) {
                _result.amount = b;
                break;
              }
            }
          }
        }

        _result.numbers_map = numList.reduce((a: any, b) => {
          a[b] = _result.amount;
          return a;
        }, {});

        _result.total_amount = (_result.amount as any) * _result.numbers.length;

        // console.log("🚀 ~ _result:", _result)

        for (let number of _result.numbers) {
          const numbers = setp_pana.find((f) => f.includes(parseInt(number)));

          // console.log("🚀 ~ numbers:", numbers)

          if (numbers) {
            for (let n of numbers) {
              const amount = parseFloat((_result.numbers_map as any)[number]);
              // console.log(`🚀 ~ amount for ${n}:`, amount)
              result.numbers.push(n);

              (result.numbers_map as any)[n] = amount;

              result.amount = amount as any;
              result.total_amount = result.total_amount + amount;
            }
          }
        }
      }
    } else {
      const _result = options?.khadiLine
        ? parseBetTextKhadiLine(betText)
        : parseBetText(betText);
      // console.log("🚀 ~ _result:", _result)

      for (let number of _result.numbers) {
        const numbers = pana.get(`${number}_${options?.type}`);
        // console.log("🚀 ~ numbers:", numbers)

        if (numbers) {
          for (let n of numbers) {
            const amount = parseFloat((_result.numbers_map as any)[number]);
            // console.log(`🚀 ~ amount for ${n}:`, amount)
            result.numbers.push(n);

            (result.numbers_map as any)[n] = amount;

            result.amount = amount as any;
            result.total_amount = result.total_amount + amount;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: {}; amount: any; }}
 */
export function parseBetTextKhadiLine(betText: string) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();
  // console.log("🚀 ~ parseBetTextKhadiLine ~ betText:", betText)

  /** amount to be return */
  let amount = 0;

  /** parsedBetTextList */
  const parsedBetTextList = betText.split("\n");
  // console.log("🚀 ~ parseBetTextKhadiLine ~ parsedBetTextList:", parsedBetTextList)

  const obj = {} as any;

  for (let i = 0; i < parsedBetTextList.length; i++) {
    let tempNumKey = "";
    let amount = 0;
    let parsedBetText = parsedBetTextList[i].trim();
    /** iterate over the text to extract numbers */
    for (let i = 0; i <= parsedBetText.length; i++) {
      /** get currect character */
      let char = parsedBetText[i];

      /** check whether the character is number or not */
      const isNum = isNumber(char);

      let remainingText = parsedBetText.substring(i);

      if (isNumber(remainingText)) {
        amount = parseInt(remainingText);
        obj[tempNumKey] = amount;

        break;
      }

      if (tempNumKey.length > 0) {
        let parsedTempNumber = parseInt(tempNumKey);

        if (parsedTempNumber >= 0 && parsedTempNumber <= 9) {
          obj[tempNumKey] = amount;

          // tempNumKey = ""
        }
      }

      if (isNum) {
        tempNumKey = tempNumKey + char;
      } else {
        if (tempNumKey) {
          obj[tempNumKey] = amount;
        }
        // tempNumKey = ""
      }
    }
  }

  const result = {
    numbers: Object.keys(obj),
    numbers_map: obj,
    amount: Object.values(obj).reduce(
      (a: any, b) => a + parseInt(b as any),
      0
    ) as any,
    total_amount: 0,
  };

  result.total_amount = (result.amount as any) * result.numbers.length;

  return result;
}

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: {}; amount: any; }}
 */
export function parseBetPanaCPTextKhadiLine(betText: string) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();

  /** amount to be return */
  let amount = 0;

  /** parsedBetTextList */
  const parsedBetTextList = betText.split("\n");

  const obj = {} as any;

  for (let i = 0; i < parsedBetTextList.length; i++) {
    let tempNumKey = "";
    let amount = 0;
    let parsedBetText = parsedBetTextList[i].trim();
    /** iterate over the text to extract numbers */
    for (let i = 0; i <= parsedBetText.length; i++) {
      /** get currect character */
      let char = parsedBetText[i];

      /** check whether the character is number or not */
      const isNum = isNumber(char);

      let remainingText = parsedBetText.substring(i);

      if (isNumber(remainingText)) {
        amount = parseInt(remainingText);
        obj[tempNumKey] = amount;

        break;
      }

      if (tempNumKey.length > 0) {
        let parsedTempNumber = parseInt(tempNumKey);

        if (parsedTempNumber >= 10 && parsedTempNumber <= 99) {
          obj[tempNumKey] = amount;

          // tempNumKey = ""
        }
      }

      if (isNum) {
        tempNumKey = tempNumKey + char;
      } else {
        if (tempNumKey) {
          obj[tempNumKey] = amount;
        }
        // tempNumKey = ""
      }
    }
  }

  const result = {
    numbers: Object.keys(obj),
    numbers_map: obj,
    amount: Object.values(obj).reduce(
      (a: any, b) => a + parseInt(b as any),
      0
    ) as any,
    total_amount: 0,
  };

  result.total_amount = (result.amount as any) * result.numbers.length;

  return result;
}

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: {}; amount: any; }}
 */
export function parsePanaBetTextKhadiLine(betText: string) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();

  /** amount to be return */
  let amount = 0;

  /** parsedBetTextList */
  const parsedBetTextList = betText.split("\n");

  const obj = {} as any;

  for (let i = 0; i < parsedBetTextList.length; i++) {
    let tempNumKey = "";
    let amount = 0;
    let parsedBetText = parsedBetTextList[i].trim();
    /** iterate over the text to extract numbers */
    for (let i = 0; i <= parsedBetText.length; i++) {
      /** get currect character */
      let char = parsedBetText[i];

      /** check whether the character is number or not */
      const isNum = isNumber(char);

      let remainingText = parsedBetText.substring(i);

      if (isNumber(remainingText)) {
        amount = parseInt(remainingText);
        obj[tempNumKey] = amount;

        break;
      }

      if (tempNumKey.length > 0) {
        let parsedTempNumber = parseInt(tempNumKey);

        if (parsedTempNumber >= 100 && parsedTempNumber <= 999) {
          obj[tempNumKey] = amount;

          // tempNumKey = ""
        }
      }

      if (isNum) {
        tempNumKey = tempNumKey + char;
      } else {
        if (tempNumKey) {
          obj[tempNumKey] = amount;
        }
        // tempNumKey = ""
      }
    }
  }

  const result = {
    numbers: Object.keys(obj),
    numbers_map: obj,
    amount: Object.values(obj).reduce(
      (a: any, b) => a + parseInt(b as any),
      0
    ) as any,
    total_amount: 0,
  };

  result.total_amount = (result.amount as any) * result.numbers.length;

  return result;
}

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: {}; amount: any; }}
 */
export function parsePanaSPMotorBetTextKhadiLine(betText: string) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();

  /** amount to be return */
  let amount = 0;

  /** parsedBetTextList */
  const parsedBetTextList = betText.split("\n");

  const obj = {} as any;

  for (let i = 0; i < parsedBetTextList.length; i++) {
    let tempNumKey = "";
    let amount = 0;
    let parsedBetText = parsedBetTextList[i].trim();
    /** iterate over the text to extract numbers */
    for (let i = 0; i <= parsedBetText.length; i++) {
      /** get currect character */
      let char = parsedBetText[i];

      /** check whether the character is number or not */
      const isNum = isNumber(char);

      let remainingText = parsedBetText.substring(i);

      if (isNumber(remainingText)) {
        amount = parseInt(remainingText);
        obj[tempNumKey] = amount;

        break;
      }

      if (tempNumKey.length > 0) {
        let parsedTempNumber = parseInt(tempNumKey);

        // if (parsedTempNumber >= 100 && parsedTempNumber <= 999) {
        //   obj[tempNumKey] = amount;

        //   // tempNumKey = ""
        // }
      }

      if (isNum) {
        tempNumKey = tempNumKey + char;
      } else {
        if (tempNumKey) {
          obj[tempNumKey] = amount;
        }
        // tempNumKey = ""
      }
    }
  }

  const result = {
    numbers: Object.keys(obj),
    numbers_map: obj,
    amount: Object.values(obj).reduce(
      (a: any, b) => a + parseInt(b as any),
      0
    ) as any,
    total_amount: 0,
  };

  result.total_amount = (result.amount as any) * result.numbers.length;

  return result;
}

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: {}; amount: any; }}
 */
export function parseJodiCrossingBetTextKhadiLine(betText: string) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();

  /** parsedBetTextList */
  const parsedBetTextList = betText.split("\n");

  const obj = {} as Record<string, number>;
  let unitAmount = 0; // yeh final amount store karega

  for (let i = 0; i < parsedBetTextList.length; i++) {
    let tempNumKey = "";
    let amount = 0;
    let parsedBetText = parsedBetTextList[i].trim();

    /** iterate over the text to extract numbers */
    for (let j = 0; j <= parsedBetText.length; j++) {
      let char = parsedBetText[j];
      const isNum = isNumber(char);
      let remainingText = parsedBetText.substring(j);

      /** agar baaki text ek number hai to wo amount hai */
      if (isNumber(remainingText)) {
        amount = parseInt(remainingText);
        unitAmount = amount; // ek hi bar assign kar do

        // crossing numbers generate
        let crossingNumbers = generateJodiCrossingNumbers(tempNumKey);
        for (let n of crossingNumbers) {
          obj[n] = amount;
        }
        break;
      }

      if (isNum) {
        tempNumKey = tempNumKey + char;
      }
    }
  }

  const result = {
    numbers: Object.keys(obj),
    numbers_map: obj,
    amount: unitAmount, // yahan ab sirf ek unit ka amount
    total_amount: Object.values(obj).reduce((a, b) => a + (b as number), 0),
  };

  return result;
}

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: any; numbers_map: any; amount: any; }}
 */
export function parseBetTextManual(betText: string) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();

  /** create a empty number list to be used later */
  const numList = [];
  /** temp number to store number with limit of 2 length */
  let tempNumber = "";

  /** iterate over the text to extract numbers */
  for (let i = 0; i <= betText.length; i++) {
    /** get currect character */
    let char = betText[i];

    /** check whether the character is number or not */
    const isNum = isNumber(char);

    if (tempNumber.length > 0) {
      let parsedTempNumber = parseInt(tempNumber);

      if (parsedTempNumber >= 0 && parsedTempNumber <= 9) {
        numList.push(tempNumber);
        tempNumber = "";
      }
    }

    if (isNum) {
      tempNumber = tempNumber + char;
    } else {
      if (tempNumber) {
        numList.push(tempNumber);
      }
      tempNumber = "";
    }
  }

  const result = {
    numbers: numList,
    amount: 0,
    numbers_map: {},
    total_amount: 0,
  };

  return result;
}

export function AddToHome(
  deferredPrompt: any,
  setdeferredPrompt: any,
  cb: any
) {
  // Show the prompt
  deferredPrompt?.prompt();
  // Wait for the user to respond to the prompt
  deferredPrompt?.userChoice?.then((choiceResult: any) => {
    if (choiceResult.outcome === "accepted") {
      // console.log("User accepted the A2HS prompt");
      // window.location.assign("https://app.smartplay24.com/")
      cb();
    } else {
      // console.log("User dismissed the A2HS prompt");
    }
    setdeferredPrompt(null);
  });
}

export function parseJodiBetText(
  betText: string,
  options?: {
    type: JodiType;
    khadiLine?: boolean;
  }
) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();
  console.log("🚀 ~ betText:", betText);
  console.log("🚀 ~ Option Type:", options?.type);

  let result = {
    numbers: [] as Array<string>,
    amount: 0,
    numbers_map: {},
    total_amount: 0,
  };

  // if (options?.type == "JODI") {

  if (options?.khadiLine) {
    // console.log("Khadi Line")
    const _result = parseJodiBetTextKhadiLine(betText);
    // console.log("🚀 ~ _result:", _result)
    // if (options.type == "JODI" && _result.numbers.length == 2) {
    //   for (let i = parseInt(_result.numbers[0]); i <= parseInt(_result.numbers[1]); i++) {
    //     result.numbers.push(i as any);
    //     (result.numbers_map as any)[i] = _result.amount;
    //     result.total_amount = result.total_amount + _result.amount;
    //   }
    //   result.amount = _result.amount;

    // }

    return _result;
  } else {
    /** amount to be return */
    let amount = 0;

    /** check whether the text has rs if it's then extract the amount */
    let rsIndex = betText.indexOf("rs");
    // // console.log("🚀 ~ parseBetText ~ rsIndex:", rsIndex)
    if (rsIndex >= 0) {
      /** temp amount to store the number after "rs" */
      let tempAmount = "";

      /** iterate over the text after "rs" */
      for (let i = rsIndex + 2; i <= betText.length; i++) {
        /** get current character */
        let char = betText[i];
        // // console.log("🚀 ~ parseBetText ~ char:", char)

        /** check if character is number or not */
        const isNum = isNumber(char);

        /** it it's number then append into stored number, else break the loop */
        if (isNum) {
          tempAmount = tempAmount + char;
        } else {
          break;
        }
      }

      /** if tempAmount has a store then assign it to the amount, and remove the amount part from the text */
      if (tempAmount) {
        amount = parseInt(tempAmount);
        betText = betText.slice(0, rsIndex);
      }
    }
    /** check whether the text has rs if it's then extract the amount (END) */

    /** create a empty number list to be used later */
    const numMap = {} as Record<any, any>;
    /** create a empty number list to be used later */
    const numList = [] as Array<any>;
    /** temp number to store number with limit of 2 length */
    let tempNumber = "";

    /** to store pair of index of each no-numeric character for future use */
    let tempCharIndexHolder = [[]];

    /** iterate over the text to extract numbers */
    for (let i = 0; i <= betText.length; i++) {
      /** get currect character */
      let char = betText[i];

      /** check whether the character is number or not */
      const isNum = isNumber(char);

      /** TASK 1 - if it's not number then store the index */
      if (!isNum) {
        let lastTempCharIndexHolder = tempCharIndexHolder.at(0) as any;

        if (lastTempCharIndexHolder?.length) {
          if (lastTempCharIndexHolder.length >= 2) {
            tempCharIndexHolder.unshift([i] as any);
          } else {
            lastTempCharIndexHolder.push(i);
          }
        } else {
          lastTempCharIndexHolder?.push(i);
        }
      }

      let remainingText = betText.substring(i);
      if (isNumber(remainingText)) {
        amount = parseInt(remainingText);
        break;
      }

      if (tempNumber.length > 0) {
        let parsedTempNumber = parseInt(tempNumber);

        if (parsedTempNumber >= 10 && parsedTempNumber <= 99) {
          numList.push(tempNumber);
          numMap[tempNumber] = 0;
          tempNumber = "";
        }
      }

      if (isNum) {
        tempNumber = tempNumber + char;
      } else {
        if (tempNumber) {
          numList.push(tempNumber);
          numMap[tempNumber] = 0;
        }
        tempNumber = "";
      }
    }
    const _result = {
      numbers: numList,
      amount: amount || numList.at(-1),
      numbers_map: {},
      total_amount: 0,
    };

    if (!amount) {
      for (let a of tempCharIndexHolder) {
        if (a.length > 1) {
          let b = betText.substring(a[0] + 1, a[1]);

          if (isNumber(b)) {
            _result.amount = b;
            break;
          }
        }
      }
    }

    _result.numbers_map = numList.reduce((a: any, b) => {
      a[b] = _result.amount;
      return a;
    }, {});

    _result.total_amount = (_result.amount as any) * _result.numbers.length;

    if (options?.type == "LADI" && _result.numbers.length == 2) {
      console.log("NUMBER OUT PUT");
      console.log("Ladi Numbers", _result.numbers);
      for (
        let i = parseInt(_result.numbers[0]);
        i <= parseInt(_result.numbers[1]);
        i++
      ) {
        result.numbers.push(i as any);
        (result.numbers_map as any)[i] = _result.amount;
        result.total_amount = result.total_amount + _result.amount;
        console.log("Ladi Result", result);
      }
      result.amount = _result.amount;
    } else if (options?.type == "CROS") {
      if (options.khadiLine) {
        const _result = parseJodiCrossingBetTextKhadiLine(betText);

        const result = {
          numbers: [] as Array<string>,
          amount: 0,
          numbers_map: {} as Record<string, number>,
          total_amount: 0,
        };

        for (let nums of _result.numbers) {
          // crossing numbers generate
          let numbers = generateJodiCrossingNumbers(nums);

          const amount = parseFloat(_result.numbers_map[nums] as any);

          for (let n of numbers) {
            result.numbers.push(n);
            result.numbers_map[n] = amount;
            result.amount = amount; // unit amount hi rahega
            result.total_amount += amount;
          }
        }

        return result;
      }

      /** amount to be return */
      let amount = 0;

      /** check whether the text has rs if it's then extract the amount */
      let rsIndex = betText.indexOf("rs");
      // console.log("🚀 ~ parseBetText ~ rsIndex:", rsIndex);
      if (rsIndex >= 0) {
        /** temp amount to store the number after "rs" */
        let tempAmount = "";

        /** iterate over the text after "rs" */
        for (let i = rsIndex + 2; i <= betText.length; i++) {
          /** get current character */
          let char = betText[i];
          // console.log("🚀 ~ parseBetText ~ char:", char);

          /** check if character is number or not */
          const isNum = isNumber(char);

          /** it it's number then append into stored number, else break the loop */
          if (isNum) {
            tempAmount = tempAmount + char;
          } else {
            break;
          }
        }

        /** if tempAmount has a store then assign it to the amount, and remove the amount part from the text */
        if (tempAmount) {
          amount = parseInt(tempAmount);
          betText = betText.slice(0, rsIndex);
        }
      }
      /** check whether the text has rs if it's then extract the amount (END) */

      /** create a empty number list to be used later */
      const numMap = {} as Record<any, any>;
      /** create a empty number list to be used later */
      const numList = [] as Array<any>;
      /** temp number to store number with limit of 2 length */
      let tempNumber = "";

      /** to store pair of index of each no-numeric character for future use */
      let tempCharIndexHolder = [[]];

      /** iterate over the text to extract numbers */
      for (let i = 0; i <= betText.length; i++) {
        /** get currect character */
        let char = betText[i];

        /** check whether the character is number or not */
        const isNum = isNumber(char);

        /** TASK 1 - if it's not number then store the index */
        if (!isNum) {
          let lastTempCharIndexHolder = tempCharIndexHolder.at(0) as any;

          if (lastTempCharIndexHolder?.length) {
            if (lastTempCharIndexHolder.length >= 2) {
              tempCharIndexHolder.unshift([i] as any);
            } else {
              lastTempCharIndexHolder.push(i);
            }
          } else {
            lastTempCharIndexHolder?.push(i);
          }
        }

        let remainingText = betText.substring(i);
        if (isNumber(remainingText)) {
          amount = parseInt(remainingText);
          break;
        }

        if (tempNumber.length > 0) {
          let parsedTempNumber = parseInt(tempNumber);

          // if (parsedTempNumber > 999) {

          //   numList.push(tempNumber)
          //   numMap[tempNumber] = 0;
          //   tempNumber = ""
          // }
        }

        if (isNum) {
          tempNumber = tempNumber + char;
        } else {
          if (tempNumber) {
            numList.push(tempNumber);
            numMap[tempNumber] = 0;
          }
          tempNumber = "";
        }
      }
      const result = {
        numbers: numList,
        amount: amount || numList.at(-1),
        numbers_map: {},
        total_amount: 0,
      };

      if (!amount) {
        for (let a of tempCharIndexHolder) {
          if (a.length > 1) {
            let b = betText.substring(a[0] + 1, a[1]);

            if (isNumber(b)) {
              result.amount = b;
              break;
            }
          }
        }
      }

      result.numbers_map = numList.reduce((a: any, b) => {
        a[b] = result.amount;
        return a;
      }, {});

      // result.total_amount = (result.amount as any) * result.numbers.length
      let numbers = [...result.numbers];
      console.log("🚀 ~ numbers:", numbers);
      result.numbers = [];
      for (let nums of numbers) {
        result.numbers = [
          ...result.numbers,
          ...generateJodiCrossingNumbers(nums),
        ];
      }

      for (let n of result.numbers) {
        (result.numbers_map as any)[n] = result.amount;
        result.total_amount = result.total_amount + result.amount;
      }
      // console.log("CROSSING NUMBERS: ", result);

      return result;
    } else if (options?.type == "CJCK") {
      // if (options.khadiLine) {
      //   const _result = parseJodiCrossingBetTextKhadiLine(betText);

      //   const result = {
      //     numbers: [] as Array<string>,
      //     amount: 0,
      //     numbers_map: {} as Record<string, number>,
      //     total_amount: 0,
      //   };

      //   for (let nums of _result.numbers) {
      //     // crossing numbers generate
      //     let numbers = generateJodiCrossingNumbers(nums);

      //     const amount = parseFloat(_result.numbers_map[nums]);

      //     for (let n of numbers) {
      //       result.numbers.push(n);
      //       result.numbers_map[n] = amount;
      //       result.amount = amount; // unit amount hi rahega
      //       result.total_amount += amount;
      //     }
      //   }

      //   return result;
      // }

      /** amount to be return */
      let amount = 0;

      /** check whether the text has rs if it's then extract the amount */
      let rsIndex = betText.indexOf("rs");
      // console.log("🚀 ~ parseBetText ~ rsIndex:", rsIndex);
      if (rsIndex >= 0) {
        /** temp amount to store the number after "rs" */
        let tempAmount = "";

        /** iterate over the text after "rs" */
        for (let i = rsIndex + 2; i <= betText.length; i++) {
          /** get current character */
          let char = betText[i];
          // console.log("🚀 ~ parseBetText ~ char:", char);

          /** check if character is number or not */
          const isNum = isNumber(char);

          /** it it's number then append into stored number, else break the loop */
          if (isNum) {
            tempAmount = tempAmount + char;
          } else {
            break;
          }
        }

        /** if tempAmount has a store then assign it to the amount, and remove the amount part from the text */
        if (tempAmount) {
          amount = parseInt(tempAmount);
          betText = betText.slice(0, rsIndex);
        }
      }
      /** check whether the text has rs if it's then extract the amount (END) */

      /** create a empty number list to be used later */
      const numMap = {} as Record<any, any>;
      /** create a empty number list to be used later */
      const numList = [] as Array<any>;
      /** temp number to store number with limit of 2 length */
      let tempNumber = "";

      /** to store pair of index of each no-numeric character for future use */
      let tempCharIndexHolder = [[]];

      /** iterate over the text to extract numbers */
      for (let i = 0; i <= betText.length; i++) {
        /** get currect character */
        let char = betText[i];

        /** check whether the character is number or not */
        const isNum = isNumber(char);

        /** TASK 1 - if it's not number then store the index */
        if (!isNum) {
          let lastTempCharIndexHolder = tempCharIndexHolder.at(0) as any;

          if (lastTempCharIndexHolder?.length) {
            if (lastTempCharIndexHolder.length >= 2) {
              tempCharIndexHolder.unshift([i] as any);
            } else {
              lastTempCharIndexHolder.push(i);
            }
          } else {
            lastTempCharIndexHolder?.push(i);
          }
        }

        let remainingText = betText.substring(i);
        if (isNumber(remainingText)) {
          amount = parseInt(remainingText);
          break;
        }

        if (tempNumber.length > 0) {
          let parsedTempNumber = parseInt(tempNumber);

          // if (parsedTempNumber > 999) {

          //   numList.push(tempNumber)
          //   numMap[tempNumber] = 0;
          //   tempNumber = ""
          // }
        }

        if (isNum) {
          tempNumber = tempNumber + char;
        } else {
          if (tempNumber) {
            numList.push(tempNumber);
            numMap[tempNumber] = 0;
          }
          tempNumber = "";
        }
      }
      const result = {
        numbers: numList,
        amount: amount || numList.at(-1),
        numbers_map: {},
        total_amount: 0,
      };

      if (!amount) {
        for (let a of tempCharIndexHolder) {
          if (a.length > 1) {
            let b = betText.substring(a[0] + 1, a[1]);

            if (isNumber(b)) {
              result.amount = b;
              break;
            }
          }
        }
      }

      result.numbers_map = numList.reduce((a: any, b) => {
        a[b] = result.amount;
        return a;
      }, {});

      // result.total_amount = (result.amount as any) * result.numbers.length
      let numbers = [...result.numbers];
      console.log("🚀 ~ numbers:", numbers);
      result.numbers = [];
      for (let nums of numbers) {
        result.numbers = [...result.numbers, ...generateJODICJCKNumbers(nums)];
      }

      for (let n of result.numbers) {
        (result.numbers_map as any)[n] = result.amount;
        result.total_amount = result.total_amount + result.amount;
      }
      console.log("CJCK NUMBERS: ", result);

      return result;
    } else {
      result = _result;
    }
  }
  // }

  return result;
}

/**
 * Description placeholder
 *
 * @export
 * @param {string} betText
 * @returns {{ numbers: {}; amount: any; }}
 */
export function parseJodiBetTextKhadiLine(betText: string) {
  /** Trim the text */
  betText = betText.trim().toLowerCase();

  /** amount to be return */
  let amount = 0;

  /** parsedBetTextList */
  const parsedBetTextList = betText.split("\n");

  const obj = {} as any;

  const result = {
    numbers: Object.keys(obj),
    numbers_map: obj,
    amount: Object.values(obj).reduce(
      (a: any, b) => a + parseInt(b as any),
      0
    ) as any,
    total_amount: 0,
  };

  for (let i = 0; i < parsedBetTextList.length; i++) {
    let tempNumKey = "";
    let amount = 0;
    let parsedBetText = parsedBetTextList[i].trim();
    /** iterate over the text to extract numbers */
    for (let i = 0; i <= parsedBetText.length; i++) {
      /** get currect character */
      let char = parsedBetText[i];

      /** check whether the character is number or not */
      const isNum = isNumber(char);

      let remainingText = parsedBetText.substring(i);

      if (isNumber(remainingText)) {
        amount = parseInt(remainingText);
        let n = parseInt(tempNumKey) as any;
        obj[n] = amount;

        if (!result.numbers.includes(tempNumKey)) {
          result.numbers.push(tempNumKey);
        }

        break;
      }

      if (tempNumKey.length > 0) {
        let parsedTempNumber = parseInt(tempNumKey);

        if (parsedTempNumber >= 10 && parsedTempNumber <= 99) {
          let n = parseInt(tempNumKey) as any;
          obj[n] = amount;

          if (!result.numbers.includes(tempNumKey)) {
            result.numbers.push(tempNumKey);
          }

          // tempNumKey = ""
        }
      }

      if (isNum) {
        tempNumKey = tempNumKey + char;
      } else {
        if (tempNumKey) {
          let n = parseInt(tempNumKey) as any;
          obj[n] = amount;

          if (!result.numbers.includes(tempNumKey)) {
            result.numbers.push(tempNumKey);
          }
        }
        // tempNumKey = ""
      }
    }
  }

  result.numbers = [...new Set(result.numbers)];

  result.amount = Object.values(obj).reduce(
    (a: any, b) => a + parseInt(b as any),
    0
  ) as any;

  result.total_amount = result.amount as any;

  return result;
}

/**
 * Function to generate all 3-digit Pana numbers from the given digits.
 * @param input A string containing digits, e.g., "12345".
 * @returns An array of strings representing Pana numbers.
 */
export function generatePanaSPMotorNumbers(input: string): string[] {
  // Convert the input string into an array of digits
  const digits = input.split("");
  console.log("Digits", digits);
  const panaNumbers: string[] = [];
  console.log("Pana Number", panaNumbers);

  // Helper function to generate combinations of three digits
  function generateCombinations(start: number, combination: string[]) {
    // If a combination of 3 digits is formed, push it to the result
    if (combination.length === 3) {
      panaNumbers.push(combination.join(""));
      return;
    }

    // Generate combinations recursively
    for (let i = start; i < digits.length; i++) {
      generateCombinations(i + 1, [...combination, digits[i]]);
    }
  }

  // Start generating combinations from the first digit
  generateCombinations(0, []);

  // Return the generated Pana numbers sorted in ascending order
  console.log("Pana Sort Number", panaNumbers.sort());
  return panaNumbers.sort();
}

// /**
//  * Function to generate all 3-digit Pana numbers from the given digits.
//  * @param input A string containing digits, e.g., "12345".
//  * @returns An array of strings representing Pana numbers.
//  */
// export function generatePanaSPMotorNumbers(input: string): string[] {
//   // // Convert the input string into an array of digits
//   // const digits = input.split('')
//   // const panaNumbers: string[] = []

//   // // Helper function to generate combinations of three digits
//   // function generateCombinations(start: number, combination: string[]) {
//   //   // If a combination of 3 digits is formed, push it to the result
//   //   if (combination.length === 3) {
//   //     panaNumbers.push(combination.join(''))
//   //     return
//   //   }

//   //   // Generate combinations recursively
//   //   for (let i = start; i < digits.length; i++) {
//   //     generateCombinations(i + 1, [...combination, digits[i]])
//   //   }
//   // }

//   // // Start generating combinations from the first digit
//   // generateCombinations(0, [])

//   // // Return the generated Pana numbers sorted in ascending order
//   // return panaNumbers.sort()

//   const sortedDigits = input.split("").sort().join("");
//   // console.log('Sorted Digits', sortedDigits)

//   // Try to get predefined pana numbers from the map
//   const panaList = sp_motor.get(sortedDigits);
//   // console.log('Pana LIst', panaList)
//   // If found, return as string array
//   if (panaList) {
//     return panaList.map(String);
//   }

//   // If not found, warn and return empty
//   console.warn(`⚠️ No SP Motor pattern found for: ${sortedDigits}`);
//   return [];
// }

/**
 * Functionto genrate all 3-digit Jodi numbers from the given digits
 * @param input A string containing digits,e.g.,"1234"
 * @returns An array of string representing jodi numbers
 */
// export function generateJODICJCKNumbers(input: string): string[] {
//   const digits = input.split("").sort().join("");
//   // console.log('CJCK Digits', digits)
//   const jodiNumbers = cjck_jodi.get(digits);

//   // function generateCombinations(combination: string[]) {
//   //   if (combination.length === 2) {
//   //     if (combination[0] !== combination[1]) {
//   //       jodiNumbers.push(combination.join(''))
//   //     }
//   //     return
//   //   }

//   //   for (let i = 0; i < digits.length; i++) {
//   //     generateCombinations([...combination, digits[i]])
//   //   }
//   // }

//   // generateCombinations([])

//   // return jodiNumbers.sort()

//   // If found, return as string array
//   if (jodiNumbers) {
//     return jodiNumbers.map(String);
//   }

//   // If not found, warn and return empty
//   console.warn(`⚠️ No SP Motor pattern found for: ${digits}`);
//   return [];
// }
export function generateJODICJCKNumbers(input: string): string[] {
  const digits = input.split("");
  const jodiNumbers: string[] = [];

  function generateCombinations(combination: string[]) {
    if (combination.length === 2) {
      if (combination[0] !== combination[1]) {
        jodiNumbers.push(combination.join(""));
      }
      return;
    }

    for (let i = 0; i < digits.length; i++) {
      generateCombinations([...combination, digits[i]]);
    }
  }

  generateCombinations([]);

  return jodiNumbers.sort();
}

/**
 * Functionto genrate all 3-digit Jodi numbers from the given digits
 * @param input A string containing digits,e.g.,"1234"
 * @returns An array of string representing jodi numbers
 */
// export function generateJodiCrossingNumbers(input: string): string[] {
//   let digits = input.split("").sort().join("");
//   // console.log('Crossing Digits', digits)
//   let jodiNumber = crossing_jodi.get(digits);
//   // function generateJodiCombinations(combination: string[]) {

//   //   if (combination.length === 2) {
//   //     jodiNumber.push(combination.join(''))
//   //     return
//   //   }

//   //   for (let i = 0; i < digits.length; i++) {
//   //     generateJodiCombinations([...combination, digits[i]])
//   //   }
//   // }

//   // generateJodiCombinations([])

//   // return jodiNumber

//   if (jodiNumber) {
//     return jodiNumber.map(String);
//   }

//   // If not found, warn and return empty
//   console.warn(`⚠️ No SP Motor pattern found for: ${digits}`);
//   return [];
// }
export function generateJodiCrossingNumbers(input: string): string[] {
  let digits = input.split("");
  let jodiNumber: string[] = [];

  function generateJodiCombinations(combination: string[]) {
    if (combination.length === 2) {
      jodiNumber.push(combination.join(""));
      return;
    }

    for (let i = 0; i < digits.length; i++) {
      generateJodiCombinations([...combination, digits[i]]);
    }
  }

  generateJodiCombinations([]);

  return jodiNumber;
}

/**
 * Function to generate all incremental DP Motor Pana numbers from the given digits.
 * DP Pana involves two repeating digits and one unique digit in incremental order.
 * @param input A string containing digits, e.g., "12345".
 * @returns An array of strings representing incremental DP Motor Pana numbers.
 */
export function generateDPMotorPana(input: string): string[] {
  // Convert the input string into an array of digits
  const digits = input.split("");
  const dpPanas: Set<string> = new Set();

  // Iterate over each digit to create the double part (like 11, 22, etc.)
  for (let i = 0; i < digits.length; i++) {
    const doubleDigit = digits[i] + digits[i]; // Create double digits (e.g., "11", "22")

    // Add a third unique digit that must be greater than or equal to the repeating digits
    for (let j = 0; j < digits.length; j++) {
      if (i !== j) {
        const thirdDigit = digits[j];

        //  console.log({
        //     digit: doubleDigit + thirdDigit,
        //     thirdDigit: thirdDigit,
        //     "digits[i]": digits[i],
        //     doubleDigit: doubleDigit,
        // });

        // Check if the third digit is in incremental order with the double digits
        if (
          (thirdDigit >= digits[i] && doubleDigit != "00") ||
          (thirdDigit <= digits[i] && thirdDigit == "0")
        ) {
          const pana = doubleDigit + thirdDigit;
          dpPanas.add(pana); // Use Set to avoid duplicates
        }
        if (
          (digits[i] >= thirdDigit && thirdDigit != "0") ||
          doubleDigit == "00"
        ) {
          const pana = thirdDigit + doubleDigit;
          // console.log(pana)
          dpPanas.add(pana); // Use Set to avoid duplicates
        }
      }
    }
  }

  // Convert Set to Array and sort the combinations
  return Array.from(dpPanas).sort();
}

export function formatCurrency(num: any) {
  if (num >= 100000) {
    return (num / 100000).toFixed(1) + "L";
  } else if (num >= 10000) {
    return num.toString();
  } else {
    return "₹" + num.toString();
  }
}
