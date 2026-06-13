<template>
  <ContractListContent
    page-title="전체 계약 목록"
    :show-organization-filter="true"
    :allow-contract-create-button="false"
  />
</template>

<script setup>
import ContractListContent from '../../components/contracts/ContractListContent.vue'
</script>
