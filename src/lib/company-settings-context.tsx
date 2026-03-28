'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

export interface Company {
  id: string
  legalName: string
  tradeName: string | null
  siren: string | null
  siret: string | null
  vatNumber: string | null
  legalForm: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  postalCode: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  iban: string | null
  bic: string | null
  bankName: string | null
  paymentConditions: string | null
  currency: string
}

export interface BankAccountItem {
  id: string
  label: string
  bankName: string | null
  ibanMasked: string | null
  bicMasked: string | null
  isDefault: boolean
}

export interface BankAccountForm {
  label: string
  bankName: string
  iban: string
  bic: string
  isDefault: boolean
}

export interface CompanyForm {
  legalName: string
  tradeName: string
  siren: string
  siret: string
  vatNumber: string
  legalForm: string
  addressLine1: string
  addressLine2: string
  city: string
  postalCode: string
  phone: string
  email: string
  website: string
}

export interface PaymentForm {
  paymentConditions: string
  currency: string
  paymentMethods: string[]
  customPaymentMethod: string
}

interface CompanySettingsContextType {
  company: Company | null
  loading: boolean
  noCompany: boolean
  logoUrl: string | null
  form: CompanyForm
  paymentForm: PaymentForm
  bankAccounts: BankAccountItem[]
  bankLoading: boolean
  setCompany: (c: Company | null) => void
  setNoCompany: (v: boolean) => void
  setLogoUrl: (url: string | null) => void
  setForm: React.Dispatch<React.SetStateAction<CompanyForm>>
  setPaymentForm: React.Dispatch<React.SetStateAction<PaymentForm>>
  loadBankAccounts: () => Promise<void>
}

const defaultForm: CompanyForm = {
  legalName: '', tradeName: '', siren: '', siret: '', vatNumber: '', legalForm: '',
  addressLine1: '', addressLine2: '', city: '', postalCode: '', phone: '', email: '', website: '',
}

const defaultPaymentForm: PaymentForm = {
  paymentConditions: '', currency: 'EUR', paymentMethods: ['bank_transfer'], customPaymentMethod: '',
}

const CompanySettingsContext = createContext<CompanySettingsContextType>({
  company: null, loading: true, noCompany: false, logoUrl: null,
  form: defaultForm, paymentForm: defaultPaymentForm,
  bankAccounts: [], bankLoading: false,
  setCompany: () => {}, setNoCompany: () => {}, setLogoUrl: () => {},
  setForm: () => {}, setPaymentForm: () => {},
  loadBankAccounts: async () => {},
})

export function useCompanySettings() {
  return useContext(CompanySettingsContext)
}

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [noCompany, setNoCompany] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [form, setForm] = useState<CompanyForm>(defaultForm)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(defaultPaymentForm)
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([])
  const [bankLoading, setBankLoading] = useState(false)

  const loadBankAccounts = useCallback(async () => {
    setBankLoading(true)
    const { data } = await api.get<{ bankAccounts: BankAccountItem[] }>('/company/bank-accounts')
    if (data?.bankAccounts) setBankAccounts(data.bankAccounts)
    setBankLoading(false)
  }, [])

  useEffect(() => {
    api.get<{ company: Company }>('/company').then(({ data }) => {
      if (data?.company) {
        setCompany(data.company)
        setLogoUrl(data.company.logoUrl)
        loadBankAccounts()
        setForm({
          legalName: data.company.legalName || '',
          tradeName: data.company.tradeName || '',
          siren: data.company.siren || '',
          siret: data.company.siret || '',
          vatNumber: data.company.vatNumber || '',
          legalForm: data.company.legalForm || '',
          addressLine1: data.company.addressLine1 || '',
          addressLine2: data.company.addressLine2 || '',
          city: data.company.city || '',
          postalCode: data.company.postalCode || '',
          phone: data.company.phone || '',
          email: data.company.email || '',
          website: data.company.website || '',
        })
        setPaymentForm({
          paymentConditions: data.company.paymentConditions || '',
          currency: data.company.currency || 'EUR',
          paymentMethods: (data.company as any).paymentMethods || ['bank_transfer'],
          customPaymentMethod: (data.company as any).customPaymentMethod || '',
        })
      } else {
        setNoCompany(true)
      }
      setLoading(false)
    })
  }, [loadBankAccounts])

  return (
    <CompanySettingsContext.Provider value={{
      company, loading, noCompany, logoUrl, form, paymentForm, bankAccounts, bankLoading,
      setCompany, setNoCompany, setLogoUrl, setForm, setPaymentForm, loadBankAccounts,
    }}>
      {children}
    </CompanySettingsContext.Provider>
  )
}
