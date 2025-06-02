import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Search, Filter, Calendar } from 'lucide-react-native';
import Input from './Input';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  query: string;
  species?: string;
  status?: string;
  dateRange?: { start: string; end: string };
  ageRange?: { min: number; max: number };
  weightRange?: { min: number; max: number };
}

export default function AdvancedSearch({ onSearch }: AdvancedSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ query: '' });

  const applyFilters = () => {
    onSearch(filters);
    setShowFilters(false);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Input
          placeholder="Search animals by ID, breed, or notes..."
          value={filters.query}
          onChangeText={(text) => setFilters({ ...filters, query: text })}
          leftIcon={<Search size={20} />}
          style={{ flex: 1 }}
        />
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Filter size={24} />
        </TouchableOpacity>
      </View>

      <Modal visible={showFilters} animationType="slide">
        {/* Advanced filter options */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
            Advanced Filters
          </Text>
          
          {/* Species filter */}
          {/* Status filter */}
          {/* Date range filter */}
          {/* Age range filter */}
          {/* Weight range filter */}
          
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 20 }}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={applyFilters}>
              <Text>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
} 