pipeline {
    agent any

    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        APP_URL = "http://localhost:3001"
        MONITOR_URL = "http://localhost:3002"
        RELEASE_VERSION = "1.0.${BUILD_NUMBER}"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Alshammarii555/8.2CDevSecOps.git'
            }
        }

        stage('Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
                sh 'test -s public/js/bundle.js'

                archiveArtifacts(
                    artifacts: 'public/js/bundle.js',
                    fingerprint: true
                )
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Code Quality') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'SONAR_TOKEN',
                        variable: 'SONAR_TOKEN'
                    )
                ]) {
                    sh '''
                        sonar-scanner \
                        -Dsonar.token="$SONAR_TOKEN" \
                        -Dsonar.qualitygate.wait=true \
                        -Dsonar.qualitygate.timeout=300
                    '''
                }
            }
        }

        stage('Security') {
            steps {
                sh '''
                    npm audit --json > npm-audit.json || true
                    test -s npm-audit.json

                    node -e '
                    const report = require("./npm-audit.json");
                    const findings = report.metadata.vulnerabilities;
                    console.log("Security scan results:");
                    console.log(JSON.stringify(findings, null, 2));
                    '
                '''

                archiveArtifacts(
                    artifacts: 'npm-audit.json',
                    fingerprint: true
                )
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker rm -f goof goof-mongo 2>/dev/null || true
                    docker compose up -d --build goof

                    curl --fail \
                        --retry 10 \
                        --retry-delay 3 \
                        --retry-connrefused \
                        "$APP_URL"
                '''
            }
        }

        stage('Release') {
            steps {
                sh '''
                    IMAGE_ID=$(docker inspect --format='{{.Image}}' goof)
                    test -n "$IMAGE_ID"

                    docker tag "$IMAGE_ID" \
                        "sit223-goof:release-$RELEASE_VERSION"

                    docker image inspect \
                        "sit223-goof:release-$RELEASE_VERSION" \
                        > /dev/null

                    echo "Released sit223-goof:release-$RELEASE_VERSION"
                '''
            }
        }

        stage('Monitoring') {
            steps {
                sh '''
                    if ! docker inspect uptime-kuma > /dev/null 2>&1
                    then
                        docker run -d \
                            --restart=always \
                            -p 3002:3001 \
                            -v uptime-kuma:/app/data \
                            --name uptime-kuma \
                            louislam/uptime-kuma:1
                    else
                        docker start uptime-kuma > /dev/null || true
                    fi

                    curl --fail \
                        --retry 10 \
                        --retry-delay 3 \
                        --retry-connrefused \
                        "$APP_URL"

                    curl --fail \
                        --retry 10 \
                        --retry-delay 3 \
                        --retry-connrefused \
                        "$MONITOR_URL"

                    echo "Application and monitoring services are available."
                '''
            }
        }
    }

    post {
        success {
            echo 'All seven DevOps lifecycle stages completed successfully.'
        }

        failure {
            echo 'The pipeline failed. Review the failed stage output.'
        }

        always {
            echo "Pipeline build number: ${BUILD_NUMBER}"
        }
    }
}
