import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { Dropdown } from '@/components/Dropdown';
import {
  DEFAULT_LANGUAGE,
  MAHARASHTRA_DISTRICTS,
  MAX_FAVOURITE_CROPS,
  TALUKAS_BY_DISTRICT,
  strings,
  type MaharashtraDistrict,
  type SupportedLanguage,
} from '@/constants';
import { normalizeFavoriteCrops } from '@/constants/maharashtraCrops';
import { radius, spacing } from '@/theme';

import { profileStrings } from '../profile.strings';
import { CropMultiSelect } from './CropMultiSelect';

export type ProfileFormValues = {
  name: string;
  district: string;
  taluka: string;
  village: string;
  favoriteCrops: string[];
  language: SupportedLanguage;
};

export type ProfileFormInitialValues = Partial<ProfileFormValues>;

type FormErrors = Partial<Record<'name' | 'district' | 'taluka' | 'village' | 'crops', string>>;

export type ProfileFormProps = {
  initialValues?: ProfileFormInitialValues;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  serverError?: string | null;
  onSubmit: (values: ProfileFormValues) => void;
};

/**
 * Shared field set for Name / District / Taluka / Village / Favourite Crops,
 * used by both `CompleteProfileScreen` and `EditProfileScreen`.
 * Language is fixed to Marathi and still sent to preserve the API contract.
 */
export function ProfileForm({
  initialValues,
  submitting,
  submitLabel,
  submittingLabel,
  serverError,
  onSubmit,
}: ProfileFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [district, setDistrict] = useState<MaharashtraDistrict | null>(
    (initialValues?.district as MaharashtraDistrict) ?? null,
  );
  const [taluka, setTaluka] = useState<string | null>(initialValues?.taluka ?? null);
  const [village, setVillage] = useState(initialValues?.village ?? '');
  const [crops, setCrops] = useState<string[]>(() =>
    normalizeFavoriteCrops(initialValues?.favoriteCrops ?? []),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const talukaOptions = useMemo(() => (district ? TALUKAS_BY_DISTRICT[district] : []), [district]);

  const handleSelectDistrict = (value: string): void => {
    setDistrict(value as MaharashtraDistrict);
    setTaluka(null);
    setErrors((e) => ({ ...e, district: undefined, taluka: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = strings.completeProfile.nameRequired;
    if (!district) nextErrors.district = strings.completeProfile.districtRequired;
    if (!taluka) nextErrors.taluka = strings.completeProfile.talukaRequired;
    if (!village.trim()) nextErrors.village = strings.completeProfile.villageRequired;
    if (crops.length === 0) nextErrors.crops = strings.completeProfile.cropsRequired;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (): void => {
    if (!validate() || !district || !taluka) return;
    onSubmit({
      name: name.trim(),
      district,
      taluka,
      village: village.trim(),
      favoriteCrops: crops,
      language: DEFAULT_LANGUAGE,
    });
  };

  return (
    <View>
      <TextInput
        mode="outlined"
        dense
        label={strings.completeProfile.nameLabel}
        placeholder={strings.completeProfile.namePlaceholder}
        value={name}
        onChangeText={(text) => {
          setName(text);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={!!errors.name}
        style={styles.field}
        editable={!submitting}
      />
      {!!errors.name && <HelperText type="error">{errors.name}</HelperText>}

      <View style={styles.field}>
        <Dropdown
          label={strings.completeProfile.districtLabel}
          value={district}
          options={MAHARASHTRA_DISTRICTS}
          onSelect={handleSelectDistrict}
          error={errors.district}
          disabled={submitting}
        />
      </View>

      <View style={styles.field}>
        <Dropdown
          label={strings.completeProfile.talukaLabel}
          value={taluka}
          options={talukaOptions}
          onSelect={(value) => {
            setTaluka(value);
            setErrors((e) => ({ ...e, taluka: undefined }));
          }}
          error={errors.taluka}
          disabled={submitting || !district}
        />
      </View>

      <TextInput
        mode="outlined"
        dense
        label={strings.completeProfile.villageLabel}
        placeholder={strings.completeProfile.villagePlaceholder}
        value={village}
        onChangeText={(text) => {
          setVillage(text);
          setErrors((e) => ({ ...e, village: undefined }));
        }}
        error={!!errors.village}
        style={styles.field}
        editable={!submitting}
      />
      {!!errors.village && <HelperText type="error">{errors.village}</HelperText>}

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

      {!!serverError && (
        <HelperText type="error" visible>
          {serverError}
        </HelperText>
      )}

      <Button
        mode="contained"
        style={styles.button}
        contentStyle={styles.buttonContent}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      >
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.xs },
  cropsField: { marginBottom: spacing.sm, marginTop: spacing.xs },
  button: { marginTop: spacing.sm, borderRadius: radius.md },
  buttonContent: { paddingVertical: spacing.xs },
});
