import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { colors, GraphitFonts } from '@/src/theme';
import { supabase } from '@/src/lib/supabase';
import FaqCategoryBadges, { FaqCategory } from '@components/faq/FaqCategoryBadges';
import FaqAccordionItem from '@components/faq/FaqAccordionItem';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import FaqSearchBar from '@components/faq/FaqSearchBar';
import FaqAiAssistent from '@components/faq/FaqAiAssistent';

type Faq = {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  position: number;
  is_active: boolean;
  video_link?: string | null;
};

export default function FaqScreen() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const loadData = async () => {
    try {
      setError(null);

      const { data: cats, error: catErr } = await supabase
        .from('faq_categories')
        .select('*')
        .order('position', { ascending: true });

      if (catErr) throw catErr;

      const { data: faqData, error: faqErr } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (faqErr) throw faqErr;

      setCategories(cats ?? []);
      setFaqs(faqData ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Errore nel caricamento delle FAQ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [categories]);

  const categoryPositionById = useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach((c) => (map[c.id] = c.position));
    return map;
  }, [categories]);

  const handleAiFaqFound = (faqId: string) => {
    const targetFaq = faqs.find((f) => f.id === faqId);
    console.log(faqId);

    if (targetFaq) {
      setSelectedCategoryId(targetFaq.category_id);
      setExpandedIds([faqId]);
      setSearchQuery('');
      flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    } else {
      console.warn("FAQ ID restituito dall'AI non trovato localmente");
    }
  };

  const filteredFaqs = useMemo(() => {
    const base = faqs.filter((f) => f.is_active);
    const byCategory = selectedCategoryId
      ? base.filter((f) => f.category_id === selectedCategoryId)
      : base;

    const q = searchQuery.trim().toLowerCase();
    const afterSearch = q
      ? byCategory.filter((faq) => faq.question.toLowerCase().includes(q))
      : byCategory;

    if (selectedCategoryId) {
      return afterSearch;
    }

    return [...afterSearch].sort((a, b) => {
      const catPosA = categoryPositionById[a.category_id] ?? Number.MAX_SAFE_INTEGER;
      const catPosB = categoryPositionById[b.category_id] ?? Number.MAX_SAFE_INTEGER;
      return catPosA !== catPosB ? catPosA - catPosB : a.position - b.position;
    });
  }, [faqs, selectedCategoryId, searchQuery, categoryPositionById]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (loading) {
    return (
      <ContentScreenLayout title="FAQ & Supporto">
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={'#C388F0'} />
          <Text style={styles.loadingText}>Caricamento FAQ...</Text>
        </View>
      </ContentScreenLayout>
    );
  }

  if (error) {
    return (
      <ContentScreenLayout title="FAQ & Supporto">
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={loadData}>
            Riprova
          </Text>
        </View>
      </ContentScreenLayout>
    );
  }

  return (
    <ContentScreenLayout title="FAQ & Supporto">
      <FaqAiAssistent onFaqFound={handleAiFaqFound} />

      <Text style={styles.subtitle}>Sfoglia le domande</Text>

      <FaqSearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <FaqCategoryBadges
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id);
          setExpandedIds([]);
        }}
      />

      <FlatList
        ref={flatListRef}
        data={filteredFaqs}
        keyExtractor={(item) => item.id}
        onRefresh={() => {
          setRefreshing(true);
          loadData();
        }}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Animated.View
            layout={LinearTransition.duration(180)}
            entering={FadeIn.duration(140).delay(index * 20)}
            exiting={FadeOut.duration(100)}
          >
            <FaqAccordionItem
              categoryName={categoryNameById[item.category_id] ?? ''}
              question={item.question}
              answer={item.answer}
              videoLink={item.video_link}
              expanded={expandedIds.includes(item.id)}
              onToggle={() => toggleExpanded(item.id)}
            />
          </Animated.View>
        )}
      />
    </ContentScreenLayout>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: colors.secondary,
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: colors.secondary,
    marginTop: 8,
  },
  errorText: {
    color: 'red',
    fontFamily: GraphitFonts.GraphitRegular,
  },
  retryText: {
    marginTop: 8,
    textDecorationLine: 'underline',
    color: colors.secondary,
    fontFamily: GraphitFonts.GraphitRegular,
  },
  listContent: {
    paddingBottom: 24,
  },
});
