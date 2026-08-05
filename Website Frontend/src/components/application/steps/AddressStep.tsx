import { MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { StepCard } from '@/components/application/StepCard'
import { TextAreaField, TextField } from '@/components/application/FormFields'
import {
  LocationSelect,
  locationNamesMatch,
  locationStrings,
  useDistricts,
  useTalukas,
  useVillages,
  type LocationOption,
} from '@/features/location'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { ApplicationFormValues } from '@/lib/application-validation'
import { sanitizeDigits } from '@/lib/field-transforms'

/**
 * Address step — district / taluka / village cascade from Location Master
 * (same APIs + selection rules as Mobile App ProfileForm).
 */
export function AddressStep() {
  const { t } = useTranslation()
  const { setValue, getValues, formState, clearErrors, trigger } =
    useFormContext<ApplicationFormValues>()

  const [district, setDistrict] = useState<LocationOption | null>(null)
  const [taluka, setTaluka] = useState<LocationOption | null>(null)
  const [village, setVillage] = useState<LocationOption | null>(null)
  const [hydratedDistrict, setHydratedDistrict] = useState(false)
  const [hydratedTaluka, setHydratedTaluka] = useState(false)
  const [hydratedVillage, setHydratedVillage] = useState(false)

  const {
    data: districts,
    loading: districtsLoading,
    error: districtsError,
    refresh: refreshDistricts,
  } = useDistricts()

  const {
    data: talukas,
    loading: talukasLoading,
    error: talukasError,
    refresh: refreshTalukas,
  } = useTalukas(district?.code)

  const {
    data: villages,
    loading: villagesLoading,
    error: villagesError,
    refresh: refreshVillages,
  } = useVillages(taluka?.code)

  const districtOptions: LocationOption[] = useMemo(
    () => districts.map((d) => ({ code: d.code, name: d.name })),
    [districts],
  )

  const talukaOptions: LocationOption[] = useMemo(
    () => talukas.map((item) => ({ code: item.code, name: item.name })),
    [talukas],
  )

  const villageOptions: LocationOption[] = useMemo(
    () =>
      villages.map((item) => ({
        code: item.code,
        name: item.name,
        subtitle: item.nameMr || undefined,
      })),
    [villages],
  )

  const setLocationField = (
    name: 'district' | 'taluka' | 'village',
    value: string,
  ) => {
    setValue(name, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    clearErrors(name)
  }

  // Hydrate district from existing draft (name match / aliases).
  useEffect(() => {
    if (hydratedDistrict || districts.length === 0) return
    const hint = getValues('district')
    if (!hint?.trim()) {
      setHydratedDistrict(true)
      return
    }
    const byName = districts.find((d) => locationNamesMatch(d.name, hint))
    if (byName) {
      setDistrict({ code: byName.code, name: byName.name })
      if (byName.name !== hint) {
        setLocationField('district', byName.name)
      }
    }
    setHydratedDistrict(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, [districts, hydratedDistrict])

  // Hydrate taluka once district known.
  useEffect(() => {
    if (!district || hydratedTaluka || talukasLoading) return
    if (talukas.length === 0 && !talukasError) return

    const hint = getValues('taluka')
    if (!hint?.trim()) {
      setHydratedTaluka(true)
      return
    }
    const byName = talukas.find((item) => locationNamesMatch(item.name, hint))
    if (byName) {
      setTaluka({ code: byName.code, name: byName.name })
      if (byName.name !== hint) {
        setLocationField('taluka', byName.name)
      }
    } else {
      setTaluka(null)
      setLocationField('taluka', '')
      setVillage(null)
      setLocationField('village', '')
    }
    setHydratedTaluka(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per district
  }, [district, talukas, talukasLoading, talukasError, hydratedTaluka])

  // Hydrate village once taluka known.
  useEffect(() => {
    if (!taluka || hydratedVillage || villagesLoading) return
    if (villages.length === 0 && !villagesError) return

    const hint = getValues('village')
    if (!hint?.trim()) {
      setHydratedVillage(true)
      return
    }
    const byName = villages.find(
      (item) =>
        locationNamesMatch(item.name, hint) ||
        (item.nameMr ? locationNamesMatch(item.nameMr, hint) : false),
    )
    if (byName) {
      setVillage({
        code: byName.code,
        name: byName.name,
        subtitle: byName.nameMr || undefined,
      })
      if (byName.name !== hint) {
        setLocationField('village', byName.name)
      }
    } else {
      setVillage(null)
      setLocationField('village', '')
    }
    setHydratedVillage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per taluka
  }, [taluka, villages, villagesLoading, villagesError, hydratedVillage])

  const onDistrictSelect = (option: LocationOption) => {
    setDistrict(option)
    setTaluka(null)
    setVillage(null)
    setHydratedTaluka(false)
    setHydratedVillage(false)
    setLocationField('district', option.name)
    setLocationField('taluka', '')
    setLocationField('village', '')
    void trigger(['district', 'taluka', 'village'])
  }

  const onTalukaSelect = (option: LocationOption) => {
    setTaluka(option)
    setVillage(null)
    setHydratedVillage(false)
    setLocationField('taluka', option.name)
    setLocationField('village', '')
    void trigger(['taluka', 'village'])
  }

  const onVillageSelect = (option: LocationOption) => {
    setVillage(option)
    setLocationField('village', option.name)
    void trigger('village')
  }

  return (
    <StepCard
      icon={MapPin}
      title={t('app.wizard.steps.address.title')}
      description={t('app.wizard.steps.address.desc')}
    >
      <LocationSelect
        label={t('app.fields.district')}
        value={district}
        options={districtOptions}
        onSelect={onDistrictSelect}
        error={formState.errors.district?.message}
        loading={districtsLoading}
        loadError={districtsError}
        onRetry={refreshDistricts}
        searchable
        placeholder={t('app.fields.districtPh')}
        required
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <LocationSelect
          label={t('app.fields.taluka')}
          value={taluka}
          options={talukaOptions}
          onSelect={onTalukaSelect}
          error={formState.errors.taluka?.message}
          disabled={!district}
          loading={Boolean(district) && talukasLoading}
          loadError={district ? talukasError : null}
          onRetry={refreshTalukas}
          searchable
          placeholder={
            !district
              ? locationStrings.selectDistrictFirst
              : t('app.fields.talukaPh')
          }
          required
        />
        <LocationSelect
          label={t('app.fields.village')}
          value={village}
          options={villageOptions}
          onSelect={onVillageSelect}
          error={formState.errors.village?.message}
          disabled={!taluka}
          loading={Boolean(taluka) && villagesLoading}
          loadError={taluka ? villagesError : null}
          onRetry={refreshVillages}
          searchable
          placeholder={
            !taluka
              ? locationStrings.selectTalukaFirst
              : t('app.fields.villagePh')
          }
          required
        />
      </div>

      <TextAreaField
        name="address"
        label={t('app.fields.address')}
        placeholder={t('app.fields.addressPh')}
        rows={3}
        required
      />
      <TextField
        name="pincode"
        label={t('app.fields.pincode')}
        inputMode="numeric"
        placeholder={t('app.fields.pincodePh')}
        maxLength={6}
        transform={(v) => sanitizeDigits(v, 6)}
        required
      />
    </StepCard>
  )
}
