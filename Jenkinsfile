pipeline {
    agent any

    environment {
        NODE_PATH = '/Users/rajesh/.nvm/versions/node/v18.20.8/bin'
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: '*/main']],
                          userRemoteConfigs: [[url: 'https://github.com/balarajeshreddyceenepalli-boop/devtest.git']]])
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    export PATH=$NODE_PATH:$PATH
                    npm install
                '''
            }
        }

        stage('Build') {
            steps {
                withCredentials([
                    string(credentialsId: 'VITE_SUPABASE_URL', variable: 'VITE_SUPABASE_URL'),
                    string(credentialsId: 'VITE_SUPABASE_ANON_KEY', variable: 'VITE_SUPABASE_ANON_KEY'),
                    string(credentialsId: 'VITE_SUPABASE_SERVICE_ROLE_KEY', variable: 'VITE_SUPABASE_SERVICE_ROLE_KEY')
                ]) {
                    sh '''
                        export PATH=$NODE_PATH:$PATH
                        echo "Building React app with Supabase env variables..."

                        # Dynamically create .env.production
                        echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" > .env.production
                        echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env.production
                        echo "VITE_SUPABASE_SERVICE_ROLE_KEY=$VITE_SUPABASE_SERVICE_ROLE_KEY" >> .env.production

                        npm run build
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            environment {
                SONAR_HOST_URL = 'http://localhost:9000'
            }
            steps {
                withSonarQubeEnv('MySonarQube') {
                    sh '''
                        export PATH=$NODE_PATH:$PATH
                        npx sonar-scanner \
                            -Dsonar.projectKey=devtest \
                            -Dsonar.sources=src \
                            -Dsonar.host.url=$SONAR_HOST_URL \
                            -Dsonar.login=$SONAR_AUTH_TOKEN
                    '''
                }
            }
        }

        stage('Serve Application') {
            steps {
                sh '''
                    export PATH=$NODE_PATH:$PATH
                    pkill -f 'serve -s dist' || true
                    nohup npx serve -s dist -l 3000 &
                    echo "✅ Application is live at http://localhost:3000"
                '''
            }
        }
    }

    post {
        success {
            echo '🎉 Build, Scan & Serve Successful!'
        }
        failure {
            echo '❌ Build failed. Check logs above.'
        }
    }
}
