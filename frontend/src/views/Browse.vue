<template>
  <UserLayout>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <h1 class="text-h4 font-weight-bold mb-6">{{ t('browse.title') }}</h1>

          <!-- Search -->
          <v-card class="mb-6">
            <v-card-text>
              <v-text-field
                v-model="search"
                :label="t('browse.searchPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                clearable
                hide-details
                @click:clear="clearSearch"
                @keyup.enter="fetchImages"
              />
            </v-card-text>
          </v-card>

          <!-- Images Grid -->
          <v-row v-if="loading && images.length === 0">
            <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3">
              <v-skeleton-loader type="card" />
            </v-col>
          </v-row>

          <v-row v-else-if="images.length === 0">
            <v-col cols="12">
              <div class="text-center py-12">
                <v-icon size="64" color="grey" class="mb-4">mdi-image-off</v-icon>
                <p class="text-h6 text-medium-emphasis">{{ t('browse.noImages') }}</p>
              </div>
            </v-col>
          </v-row>

          <v-row v-else>
            <v-col
              v-for="image in images"
              :key="imageKey(image)"
              cols="6"
              sm="4"
              md="3"
            >
              <v-card class="image-card" @click="openPreview(image)">
                <v-img
                  :src="getImageUrl(image)"
                  height="200"
                  cover
                >
                  <template #error>
                    <div class="d-flex align-center justify-center h-100">
                      <v-icon size="48" color="grey">mdi-image-broken</v-icon>
                    </div>
                  </template>
                </v-img>
                <v-card-text class="pa-2">
                  <p class="text-caption text-truncate">{{ image.name }}</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Load More -->
          <div v-if="hasMore" class="text-center mt-6">
            <v-btn
              variant="tonal"
              :loading="loading"
              @click="loadMore"
            >
              {{ t('browse.loadMore') }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Preview Dialog -->
    <v-dialog v-model="showPreview" max-width="90vw" max-height="90vh">
      <v-card v-if="previewImage">
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-truncate">{{ previewImage.name }}</span>
          <v-btn icon variant="text" @click="showPreview = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-img
            :src="getImageUrl(previewImage)"
            max-height="70vh"
            contain
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="copyLink(previewImage)">
            <v-icon start>mdi-content-copy</v-icon>
            {{ t('dashboard.copyLink') }}
          </v-btn>
          <v-btn :href="getImageUrl(previewImage)" target="_blank">
            <v-icon start>mdi-download</v-icon>
            {{ t('common.download') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </UserLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { publicApi } from '@/api'
import { copyToClipboard } from '@/utils/helpers'
import UserLayout from '@/layouts/UserLayout.vue'

const { t } = useI18n()

const loading = ref(false)
const images = ref([])
const search = ref('')
const page = ref(0)
const pageSize = ref(24)
const hasMore = ref(true)
const showPreview = ref(false)
const previewImage = ref(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

onMounted(() => {
  fetchImages()
})

const fetchImages = async (reset = true) => {
  if (reset) {
    page.value = 0
    images.value = []
    hasMore.value = true
  }

  loading.value = true
  try {
    const params = {
      start: page.value * pageSize.value,
      count: pageSize.value
    }
    if (search.value) params.search = search.value

    const response = await publicApi.getPublicList(params)
    const newImages = response.data.files || []
    
    if (reset) {
      images.value = newImages
    } else {
      images.value.push(...newImages)
    }
    
    hasMore.value = newImages.length === pageSize.value
  } catch (error) {
    console.error('Failed to fetch images:', error)
  } finally {
    loading.value = false
  }
}

const clearSearch = () => {
  search.value = ''
  fetchImages()
}

const loadMore = () => {
  page.value++
  fetchImages(false)
}

const imageKey = (image) => {
  return image.id || image.name || Math.random().toString()
}

const getImageUrl = (image) => {
  return image.url || `/file/${image.id}`
}

const openPreview = (image) => {
  previewImage.value = image
  showPreview.value = true
}

const copyLink = async (image) => {
  const url = `${window.location.origin}${getImageUrl(image)}`
  const success = await copyToClipboard(url)
  if (success) {
    showMessage(t('dashboard.linkCopied'), 'success')
  }
}

const showMessage = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>

<style scoped>
.image-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
