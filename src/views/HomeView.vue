<script setup>
import { useCounterStore } from '../stores/counter'

const counterStore = useCounterStore()
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-6" rounded="lg" elevation="4">
          <div class="d-flex align-center justify-space-between mb-6">
            <div>
              <p class="text-overline text-medium-emphasis mb-1">Vue 3 + Vite</p>
              <h1 class="text-h4 font-weight-bold">Relia Frontend Starter</h1>
            </div>
            <v-chip color="primary" variant="flat">Vuetify Ready</v-chip>
          </div>

          <v-alert type="info" variant="tonal" class="mb-6">
            Pinia, Vue Router, Axios, and Vuetify are preconfigured.
          </v-alert>

          <v-row class="mb-4">
            <v-col cols="12" sm="6">
              <v-card variant="outlined" class="pa-4 fill-height">
                <div class="text-subtitle-1 font-weight-medium mb-2">State</div>
                <div class="text-body-2 text-medium-emphasis mb-4">
                  Counter: {{ counterStore.count }} / Doubled: {{ counterStore.doubledCount }}
                </div>
                <v-btn color="primary" @click="counterStore.increment">Increment</v-btn>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6">
              <v-card variant="outlined" class="pa-4 fill-height">
                <div class="text-subtitle-1 font-weight-medium mb-2">API</div>
                <div class="text-body-2 text-medium-emphasis">
                  Axios instance base URL:
                  <code>{{ apiBaseUrl }}</code>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="mb-4" />

          <div class="text-body-2 text-medium-emphasis">
            Start building screens from Figma in <code>src/views</code> and split reusable UI into
            <code>src/components</code>.
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
