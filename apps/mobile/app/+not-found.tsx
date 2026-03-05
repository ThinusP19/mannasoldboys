import { Link, Stack } from 'expo-router';
import { YStack, Text, Button } from 'tamagui';
import { AlertCircle } from '@tamagui/lucide-icons';

import { brandColors } from '../src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$5"
        backgroundColor="$background"
      >
        <AlertCircle size={64} color={brandColors.potchGimNavy} />
        <Text
          fontSize={20}
          fontWeight="bold"
          color="$color"
          marginTop="$4"
          textAlign="center"
        >
          This screen doesn't exist.
        </Text>

        <Link href="/" asChild>
          <Button
            marginTop="$4"
            backgroundColor={brandColors.potchGimNavy}
          >
            <Text color="white">Go to home screen</Text>
          </Button>
        </Link>
      </YStack>
    </>
  );
}
