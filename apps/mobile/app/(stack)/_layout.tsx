import { Stack } from 'expo-router';

import { brandColors } from '../../src/theme';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: brandColors.potchGimNavy,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="alumni/[id]"
        options={{
          title: 'Alumni Profile',
        }}
      />
      <Stack.Screen
        name="year-group/[year]"
        options={{
          title: 'Year Group',
        }}
      />
      <Stack.Screen
        name="reunion/[id]"
        options={{
          title: 'Reunion Details',
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="membership"
        options={{
          title: 'Become a Member',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="stories"
        options={{
          title: 'Stories',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="memoriam"
        options={{
          title: 'In Memoriam',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="give-back"
        options={{
          title: 'Give Back',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
