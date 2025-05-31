import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { PAGINATION } from '../utils/constants';

export function useTerms() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: PAGINATION.DEFAULT_PER_PAGE,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory && { category: selectedCategory }),
      };
      
      const data = await apiService.getTerms(params);
      setTerms(data.terms);
      setTotalPages(data.pages);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch terms');
    } finally {
      setLoading(false);
    }
  };

  const addTerm = async (termData) => {
    const data = await apiService.addTerm(termData);
    await fetchTerms();
    return data;
  };

  const updateTerm = async (id, termData) => {
    const data = await apiService.updateTerm(id, termData);
    await fetchTerms();
    return data;
  };

  const deleteTerm = async (id) => {
    const data = await apiService.deleteTerm(id);
    await fetchTerms();
    return data;
  };

  useEffect(() => {
    fetchTerms();
  }, [currentPage, searchQuery, selectedCategory]);

  return {
    terms,
    loading,
    error,
    currentPage,
    totalPages,
    searchQuery,
    selectedCategory,
    setCurrentPage,
    setSearchQuery: (query) => {
      setSearchQuery(query);
      setCurrentPage(1);
    },
    setSelectedCategory: (category) => {
      setSelectedCategory(category);
      setCurrentPage(1);
    },
    addTerm,
    updateTerm,
    deleteTerm,
    refetch: fetchTerms,
  };
}