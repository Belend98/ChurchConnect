import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

type ScreenLayoutProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function ScreenLayout({
  title,
  description,
  children,
}: ScreenLayoutProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

type EmptySectionProps = {
  label: string;
};

export function EmptySection({ label }: EmptySectionProps) {
  return (
    <View style={styles.emptySection}>
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  header: {
    gap: 8,
    marginBottom: 24,
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
  },
  description: {
    color: "#6B7280",
    fontSize: 16,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  emptySection: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 140,
    padding: 24,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 15,
  },
});
