<template>
  <ContractListContent
    page-title="전체 계약"
    :show-organization-filter="false"
    :allow-contract-create-button="false"
  />
</template>

<script setup>
import ContractListContent from '../../components/contracts/ContractListContent.vue'
</script>
