import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { Dropdown } from '@/components/Dropdown';
import { radius, spacing, useAppTheme } from '@/theme';

import {
  MARKETPLACE_UNITS,
  PRODUCT_CATEGORIES,
} from '../marketplace.constants';
import { marketplaceStrings } from '../marketplace.strings';
import type {
  CreateListingPayload,
  ListingType,
  MarketplaceCategory,
  MarketplaceListing,
  MarketplaceUnit,
  UpdateListingPayload,
} from '../marketplace.types';

export type ListingFormValues = {
  listingType: ListingType;
  crop: string;
  quantity: string;
  unit: MarketplaceUnit | null;
  expectedPrice: string;
  harvestDate: string;
  productName: string;
  brand: string;
  category: MarketplaceCategory | null;
  stock: string;
  price: string;
  description: string;
};

type ListingFormProps = {
  initialListing?: MarketplaceListing;
  submitting: boolean;
  serverError?: string | null;
  onSubmit: (payload: CreateListingPayload | UpdateListingPayload) => void;
  submitLabel: string;
  submittingLabel: string;
};

const emptyValues = (listingType: ListingType = 'produce'): ListingFormValues => ({
  listingType,
  crop: '',
  quantity: '',
  unit: null,
  expectedPrice: '',
  harvestDate: '',
  productName: '',
  brand: '',
  category: null,
  stock: '',
  price: '',
  description: '',
});

const valuesFromListing = (listing: MarketplaceListing): ListingFormValues => ({
  listingType: listing.listingType,
  crop: listing.crop ?? '',
  quantity: listing.quantity != null ? String(listing.quantity) : '',
  unit: listing.unit ?? null,
  expectedPrice:
    listing.expectedPrice != null
      ? String(listing.expectedPrice)
      : listing.price != null
        ? String(listing.price)
        : '',
  harvestDate: listing.harvestDate ? listing.harvestDate.slice(0, 10) : '',
  productName: listing.title,
  brand: listing.brand ?? '',
  category: listing.category,
  stock: listing.stock != null ? String(listing.stock) : '',
  price: String(listing.price),
  description: listing.description ?? '',
});

const parseNumber = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export function ListingForm({
  initialListing,
  submitting,
  serverError,
  onSubmit,
  submitLabel,
  submittingLabel,
}: ListingFormProps) {
  const theme = useAppTheme();
  const isEdit = !!initialListing;
  const [values, setValues] = useState<ListingFormValues>(() =>
    initialListing ? valuesFromListing(initialListing) : emptyValues(),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormValues, string>>>({});

  const categoryOptions = useMemo(
    () => (values.listingType === 'produce' ? ['Produce'] : [...PRODUCT_CATEGORIES]),
    [values.listingType],
  );

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof ListingFormValues, string>> = {};

    if (values.listingType === 'produce') {
      if (!values.crop.trim()) nextErrors.crop = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.quantity)) nextErrors.quantity = marketplaceStrings.errors.invalidQuantity;
      if (!values.unit) nextErrors.unit = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.expectedPrice)) nextErrors.expectedPrice = marketplaceStrings.errors.invalidPrice;
      if (!values.harvestDate.trim()) nextErrors.harvestDate = marketplaceStrings.errors.requiredField;
    } else {
      if (!values.productName.trim()) nextErrors.productName = marketplaceStrings.errors.requiredField;
      if (!values.category) nextErrors.category = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.price)) nextErrors.price = marketplaceStrings.errors.invalidPrice;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (values.listingType === 'produce') {
      const price = parseNumber(values.expectedPrice)!;
      const payload: CreateListingPayload = {
        listingType: 'produce',
        title: values.crop.trim(),
        category: 'Produce',
        price,
        expectedPrice: price,
        crop: values.crop.trim(),
        quantity: parseNumber(values.quantity)!,
        unit: values.unit!,
        harvestDate: values.harvestDate.trim(),
        description: values.description.trim() || undefined,
        images: initialListing?.images ?? [],
      };
      onSubmit(payload);
      return;
    }

    const payload: CreateListingPayload = {
      listingType: 'product',
      title: values.productName.trim(),
      category: values.category!,
      price: parseNumber(values.price)!,
      brand: values.brand.trim() || undefined,
      stock: parseNumber(values.stock) ?? undefined,
      description: values.description.trim() || undefined,
      images: initialListing?.images ?? [],
    };
    onSubmit(payload);
  };

  const handleListingTypeChange = (nextType: string) => {
    if (isEdit) return;
    const listingType = nextType as ListingType;
    setValues(emptyValues(listingType));
    setErrors({});
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!isEdit ? (
        <SegmentedButtons
          value={values.listingType}
          onValueChange={handleListingTypeChange}
          buttons={[
            { value: 'produce', label: marketplaceStrings.create.produce },
            { value: 'product', label: marketplaceStrings.create.product },
          ]}
          style={styles.segmented}
        />
      ) : null}

      {values.listingType === 'produce' ? (
        <>
          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.crop}
            placeholder={marketplaceStrings.create.cropPlaceholder}
            value={values.crop}
            onChangeText={(crop) => setValues((v) => ({ ...v, crop }))}
            error={!!errors.crop}
          />
          {errors.crop ? <HelperText type="error">{errors.crop}</HelperText> : null}

          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.quantity}
            value={values.quantity}
            onChangeText={(quantity) => setValues((v) => ({ ...v, quantity }))}
            keyboardType="numeric"
            error={!!errors.quantity}
          />
          {errors.quantity ? <HelperText type="error">{errors.quantity}</HelperText> : null}

          <Dropdown
            label={marketplaceStrings.create.unit}
            value={values.unit}
            options={MARKETPLACE_UNITS}
            onSelect={(unit) => setValues((v) => ({ ...v, unit: unit as MarketplaceUnit }))}
            error={errors.unit}
          />

          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.expectedPrice}
            value={values.expectedPrice}
            onChangeText={(expectedPrice) => setValues((v) => ({ ...v, expectedPrice }))}
            keyboardType="numeric"
            error={!!errors.expectedPrice}
          />
          {errors.expectedPrice ? <HelperText type="error">{errors.expectedPrice}</HelperText> : null}

          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.harvestDate}
            placeholder={marketplaceStrings.create.harvestDatePlaceholder}
            value={values.harvestDate}
            onChangeText={(harvestDate) => setValues((v) => ({ ...v, harvestDate }))}
            error={!!errors.harvestDate}
          />
          {errors.harvestDate ? <HelperText type="error">{errors.harvestDate}</HelperText> : null}
        </>
      ) : (
        <>
          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.productName}
            placeholder={marketplaceStrings.create.productNamePlaceholder}
            value={values.productName}
            onChangeText={(productName) => setValues((v) => ({ ...v, productName }))}
            error={!!errors.productName}
          />
          {errors.productName ? <HelperText type="error">{errors.productName}</HelperText> : null}

          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.brand}
            placeholder={marketplaceStrings.create.brandPlaceholder}
            value={values.brand}
            onChangeText={(brand) => setValues((v) => ({ ...v, brand }))}
          />

          <Dropdown
            label={marketplaceStrings.create.category}
            value={values.category}
            options={categoryOptions}
            onSelect={(category) =>
              setValues((v) => ({ ...v, category: category as MarketplaceCategory }))
            }
            error={errors.category}
          />

          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.stock}
            value={values.stock}
            onChangeText={(stock) => setValues((v) => ({ ...v, stock }))}
            keyboardType="numeric"
          />

          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.price}
            value={values.price}
            onChangeText={(price) => setValues((v) => ({ ...v, price }))}
            keyboardType="numeric"
            error={!!errors.price}
          />
          {errors.price ? <HelperText type="error">{errors.price}</HelperText> : null}
        </>
      )}

      <TextInput
        mode="outlined"
        label={marketplaceStrings.create.description}
        placeholder={marketplaceStrings.create.descriptionPlaceholder}
        value={values.description}
        onChangeText={(description) => setValues((v) => ({ ...v, description }))}
        multiline
        numberOfLines={4}
      />

      <View style={[styles.imagePlaceholder, { borderColor: theme.colors.outlineVariant }]}>
        <Text variant="bodyMedium">{marketplaceStrings.create.imagesPlaceholder}</Text>
      </View>

      {serverError ? <HelperText type="error">{serverError}</HelperText> : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  segmented: { marginBottom: spacing.sm },
  imagePlaceholder: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButton: { marginTop: spacing.md, borderRadius: radius.md },
  submitButtonContent: { paddingVertical: spacing.xs },
});
