import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { DEFAULT_LANGUAGE, MAX_FAVOURITE_CROPS, strings, type SupportedLanguage } from '@/constants';
import { resolveFavoriteCrops } from '@/features/crop';
import {
  LocationSelect,
  locationStrings,
  useDistricts,
  useTalukas,
  useVillages,
  type LocationOption,
} from '@/features/location';
import { locationNamesMatch } from '@/features/location/location.utils';
import type { ProfileLocationBlock } from '@/features/location/location.types';
import { buttonSurface, cardSurface, elevation, radius, spacing, typography, useAppTheme } from '@/theme';

import { profileStrings } from '../profile.strings';
import { CropMultiSelect } from './CropMultiSelect';

export type ProfileFormValues = {
  name: string;
  district: string;
  taluka: string;
  village: string;
  districtCode: number;
  talukaCode: number;
  villageCode: number;
  favoriteCrops: string[];
  language: SupportedLanguage;
};

export type ProfileFormInitialValues = {
  name?: string;
  district?: string;
  taluka?: string;
  village?: string;
  favoriteCrops?: string[];
  location?: ProfileLocationBlock;
};

type FormErrors = Partial<Record<'name' | 'district' | 'taluka' | 'village' | 'crops', string>>;

export type ProfileFormProps = {
  initialValues?: ProfileFormInitialValues;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  serverError?: string | null;
  onNameChange?: (value: string) => void;
  onSubmit: (values: ProfileFormValues) => void;
  /** Visual-only section cards (Edit Profile). Does not change validation or payload. */
  sectioned?: boolean;
};

function FormSection({
  title,
  children,
  sectioned,
}: {
  title: string;
  children: ReactNode;
  sectioned: boolean;
}) {
  const theme = useAppTheme();
  if (!sectioned) {
    return <View style={styles.plainSection}>{children}</View>;
  }
  return (
    <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }, cardSurface]}>
      <Text style={[typography.sectionTitle, { color: theme.colors.onSurface, marginBottom: spacing.sm }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * Shared Name / District / Taluka / Village / Crops form for Complete + Edit Profile.
 * Location options come from the LGD Location Master APIs (not hardcoded constants).
 */
export function ProfileForm({
  initialValues,
  submitting,
  submitLabel,
  submittingLabel,
  serverError,
  onNameChange,
  onSubmit,
  sectioned = false,
}: ProfileFormProps) {
  const theme = useAppTheme();
  const [name, setName] = useState(initialValues?.name ?? '');
  const [district, setDistrict] = useState<LocationOption | null>(null);
  const [taluka, setTaluka] = useState<LocationOption | null>(null);
  const [village, setVillage] = useState<LocationOption | null>(null);
  const [crops, setCrops] = useState<string[]>(initialValues?.favoriteCrops ?? []);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hydratedDistrict, setHydratedDistrict] = useState(false);
  const [hydratedTaluka, setHydratedTaluka] = useState(false);
  const [hydratedVillage, setHydratedVillage] = useState(false);
  const [hydratedCrops, setHydratedCrops] = useState(false);

  useEffect(() => {
    onNameChange?.(name);
  }, [name, onNameChange]);

  // Resolve legacy favourite labels to canonical Agmarknet names via Crop Master.
  useEffect(() => {
    if (hydratedCrops) return;
    const initial = initialValues?.favoriteCrops ?? [];
    if (initial.length === 0) {
      setHydratedCrops(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const resolved = await resolveFavoriteCrops(initial);
        if (!cancelled) setCrops(resolved);
      } finally {
        if (!cancelled) setHydratedCrops(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydratedCrops, initialValues?.favoriteCrops]);

  const {
    data: districts,
    loading: districtsLoading,
    error: districtsError,
    refresh: refreshDistricts,
  } = useDistricts();

  const {
    data: talukas,
    loading: talukasLoading,
    error: talukasError,
    refresh: refreshTalukas,
  } = useTalukas(district?.code);

  const {
    data: villages,
    loading: villagesLoading,
    error: villagesError,
    refresh: refreshVillages,
  } = useVillages(taluka?.code);

  const districtOptions: LocationOption[] = useMemo(
    () => districts.map((d) => ({ code: d.code, name: d.name })),
    [districts],
  );

  const talukaOptions: LocationOption[] = useMemo(
    () => talukas.map((t) => ({ code: t.code, name: t.name })),
    [talukas],
  );

  const villageOptions: LocationOption[] = useMemo(
    () =>
      villages.map((v) => ({
        code: v.code,
        name: v.name,
        subtitle: v.nameMr || undefined,
      })),
    [villages],
  );

  // Hydrate district from initial profile (codes preferred, then name match).
  useEffect(() => {
    if (hydratedDistrict || districts.length === 0) return;

    const loc = initialValues?.location?.district;
    if (loc?.code != null) {
      const byCode = districts.find((d) => d.code === loc.code);
      if (byCode) {
        setDistrict({ code: byCode.code, name: byCode.name });
        setHydratedDistrict(true);
        return;
      }
    }

    const nameHint = loc?.name ?? initialValues?.district;
    if (nameHint) {
      const byName = districts.find((d) => locationNamesMatch(d.name, nameHint));
      if (byName) {
        setDistrict({ code: byName.code, name: byName.name });
      }
    }
    setHydratedDistrict(true);
  }, [districts, hydratedDistrict, initialValues]);

  // Hydrate taluka once district is known and talukas have loaded.
  useEffect(() => {
    if (!district || hydratedTaluka || talukasLoading) return;
    if (talukas.length === 0 && !talukasError) return;

    const loc = initialValues?.location?.taluka;
    if (loc?.code != null) {
      const byCode = talukas.find((t) => t.code === loc.code);
      if (byCode) {
        setTaluka({ code: byCode.code, name: byCode.name });
        setHydratedTaluka(true);
        return;
      }
    }

    const nameHint = loc?.name ?? initialValues?.taluka;
    if (nameHint) {
      const byName = talukas.find((t) => locationNamesMatch(t.name, nameHint));
      if (byName) {
        setTaluka({ code: byName.code, name: byName.name });
      }
    }
    setHydratedTaluka(true);
  }, [district, talukas, talukasLoading, talukasError, hydratedTaluka, initialValues]);

  // Hydrate village once taluka is known and villages have loaded.
  useEffect(() => {
    if (!taluka || hydratedVillage || villagesLoading) return;
    if (villages.length === 0 && !villagesError) return;

    const loc = initialValues?.location?.village;
    if (loc?.code != null) {
      const byCode = villages.find((v) => v.code === loc.code);
      if (byCode) {
        setVillage({
          code: byCode.code,
          name: byCode.name,
          subtitle: byCode.nameMr || undefined,
        });
        setHydratedVillage(true);
        return;
      }
    }

    const nameHint = loc?.name ?? initialValues?.village;
    if (nameHint) {
      const byName = villages.find((v) => locationNamesMatch(v.name, nameHint));
      if (byName) {
        setVillage({
          code: byName.code,
          name: byName.name,
          subtitle: byName.nameMr || undefined,
        });
      }
    }
    setHydratedVillage(true);
  }, [taluka, villages, villagesLoading, villagesError, hydratedVillage, initialValues]);

  const handleSelectDistrict = (option: LocationOption): void => {
    setDistrict(option);
    setTaluka(null);
    setVillage(null);
    setHydratedTaluka(true);
    setHydratedVillage(true);
    setErrors((e) => ({ ...e, district: undefined, taluka: undefined, village: undefined }));
  };

  const handleSelectTaluka = (option: LocationOption): void => {
    setTaluka(option);
    setVillage(null);
    setHydratedVillage(true);
    setErrors((e) => ({ ...e, taluka: undefined, village: undefined }));
  };

  const handleSelectVillage = (option: LocationOption): void => {
    setVillage(option);
    setErrors((e) => ({ ...e, village: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = strings.completeProfile.nameRequired;
    if (!district) nextErrors.district = strings.completeProfile.districtRequired;
    if (!taluka) nextErrors.taluka = strings.completeProfile.talukaRequired;
    if (!village) nextErrors.village = strings.completeProfile.villageRequired;
    if (crops.length === 0) nextErrors.crops = strings.completeProfile.cropsRequired;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (): void => {
    if (!validate() || !district || !taluka || !village) return;
    onSubmit({
      name: name.trim(),
      district: district.name,
      taluka: taluka.name,
      village: village.name,
      districtCode: district.code,
      talukaCode: taluka.code,
      villageCode: village.code,
      favoriteCrops: crops,
      language: DEFAULT_LANGUAGE,
    });
  };

  const locationBusy = districtsLoading || talukasLoading || villagesLoading;
  const outlineStyle = { borderRadius: radius.lg };

  return (
    <View style={sectioned ? styles.sectionedRoot : undefined}>
      <FormSection title={profileStrings.sections.personal} sectioned={sectioned}>
        <TextInput
          mode="outlined"
          label={strings.completeProfile.nameLabel}
          placeholder={strings.completeProfile.namePlaceholder}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors((e) => ({ ...e, name: undefined }));
          }}
          error={!!errors.name}
          style={styles.field}
          outlineStyle={outlineStyle}
          editable={!submitting}
        />
        {!!errors.name && <HelperText type="error">{errors.name}</HelperText>}
      </FormSection>

      <FormSection title={profileStrings.sections.location} sectioned={sectioned}>
        <View style={styles.field}>
          <LocationSelect
            label={strings.completeProfile.districtLabel}
            value={district}
            options={districtOptions}
            onSelect={handleSelectDistrict}
            error={errors.district}
            disabled={submitting}
            loading={districtsLoading}
            loadError={districtsError}
            onRetry={refreshDistricts}
            searchable
            placeholder={strings.completeProfile.districtPlaceholder}
          />
        </View>

        <View style={styles.field}>
          <LocationSelect
            label={strings.completeProfile.talukaLabel}
            value={taluka}
            options={talukaOptions}
            onSelect={handleSelectTaluka}
            error={errors.taluka}
            disabled={submitting || !district}
            loading={!!district && talukasLoading}
            loadError={district ? talukasError : null}
            onRetry={refreshTalukas}
            searchable
            placeholder={!district ? locationStrings.selectDistrictFirst : strings.completeProfile.talukaPlaceholder}
          />
        </View>

        <View style={styles.field}>
          <LocationSelect
            label={strings.completeProfile.villageLabel}
            value={village}
            options={villageOptions}
            onSelect={handleSelectVillage}
            error={errors.village}
            disabled={submitting || !taluka}
            loading={!!taluka && villagesLoading}
            loadError={taluka ? villagesError : null}
            onRetry={refreshVillages}
            searchable
            placeholder={!taluka ? locationStrings.selectTalukaFirst : strings.completeProfile.villagePlaceholder}
          />
        </View>
      </FormSection>

      <FormSection title={profileStrings.sections.crops} sectioned={sectioned}>
        <View style={styles.cropsField}>
          <CropMultiSelect
            label={profileStrings.crops.title}
            helperText={profileStrings.crops.helper}
            selected={crops}
            onChange={(next) => {
              setCrops(next);
              setErrors((e) => ({ ...e, crops: undefined }));
            }}
            max={MAX_FAVOURITE_CROPS}
            error={errors.crops}
            disabled={submitting}
          />
        </View>
      </FormSection>

      {!!serverError && (
        <HelperText type="error" visible>
          {serverError}
        </HelperText>
      )}

      <Button
        mode="contained"
        style={[styles.button, buttonSurface, elevation.soft]}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting || locationBusy || !!districtsError}
        buttonColor={theme.colors.primary}
      >
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionedRoot: { gap: spacing.md },
  plainSection: {},
  sectionCard: {
    padding: spacing.md,
    marginBottom: 0,
  },
  field: { marginBottom: spacing.sm },
  cropsField: { marginBottom: spacing.xs, marginTop: 0 },
  button: { marginTop: spacing.sm, borderRadius: radius.lg },
  buttonContent: { minHeight: 54, paddingVertical: spacing.xs },
  buttonLabel: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
});
