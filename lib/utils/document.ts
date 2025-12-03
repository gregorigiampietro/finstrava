export function formatDocument(document: string, type: 'cpf' | 'cnpj'): string {
  const cleanDocument = document.replace(/\D/g, '');
  
  if (type === 'cpf') {
    return cleanDocument.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else {
    return cleanDocument.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}

export function detectDocumentType(document: string): 'cpf' | 'cnpj' | null {
  const cleanDocument = document.replace(/\D/g, '');
  
  if (cleanDocument.length === 11) {
    return 'cpf';
  } else if (cleanDocument.length === 14) {
    return 'cnpj';
  }
  
  return null;
}

export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF[9])) return false;
  
  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF[10])) return false;
  
  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validate first digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights1[i];
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCNPJ[12])) return false;
  
  // Validate second digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights2[i];
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCNPJ[13])) return false;
  
  return true;
}

export function validateDocument(document: string, type: 'cpf' | 'cnpj'): boolean {
  return type === 'cpf' ? validateCPF(document) : validateCNPJ(document);
}

export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

export function formatZipCode(zipCode: string): string {
  const cleanZipCode = zipCode.replace(/\D/g, '');
  return cleanZipCode.replace(/(\d{5})(\d{3})/, '$1-$2');
}