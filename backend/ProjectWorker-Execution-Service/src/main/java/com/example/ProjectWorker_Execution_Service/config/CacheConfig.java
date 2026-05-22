package com.example.ProjectWorker_Execution_Service.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.SerializationException;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.io.IOException;
import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheConfiguration redisCacheConfiguration() {
        PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("com.example.ProjectWorker_Execution_Service")
                .allowIfSubType("java.util")
                .allowIfSubType("java.time")
                .build();

        ObjectMapper mapper = new ObjectMapper()
                .findAndRegisterModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL);

        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new JacksonRedisSerializer(mapper)));
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory)
                .cacheDefaults(redisCacheConfiguration())
                .build();
    }

    /** Replacement for the deprecated GenericJackson2JsonRedisSerializer. */
    private static final class JacksonRedisSerializer implements RedisSerializer<Object> {

        private final ObjectMapper mapper;

        JacksonRedisSerializer(ObjectMapper mapper) {
            this.mapper = mapper;
        }

        @Override
        public byte[] serialize(Object value) throws SerializationException {
            if (value == null) return null;
            try {
                return mapper.writeValueAsBytes(value);
            } catch (JsonProcessingException e) {
                throw new SerializationException("Could not serialize to JSON", e);
            }
        }

        @Override
        public Object deserialize(byte[] bytes) throws SerializationException {
            if (bytes == null || bytes.length == 0) return null;
            try {
                return mapper.readValue(bytes, Object.class);
            } catch (IOException e) {
                throw new SerializationException("Could not deserialize from JSON", e);
            }
        }
    }
}
